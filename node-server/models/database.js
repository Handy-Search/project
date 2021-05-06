const { MongoClient } = require("mongodb");
const Stemmer = require("snowball-stemmers");
// Replace the uri string with your MongoDB deployment's connection string.
const uri = process.env.MONGO_URI
console.log(uri)

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect()
  .then(async () => {
    console.log("mongodb connected!")
    // console.log((await search("organ civic")).length)
  })
  .catch(console.log)



async function search(query) {
  const database = client.db('handy_search');
  // const docFreqs = database.collection('docFreq')

  var queryClean = query.replace("/[^a-zA-Z0-9\s]/g", "");
  var words = queryClean.split(" ");
  var stem = Stemmer.newStemmer('english');
  words = words.map(word => stem.stem(word));

  let wordCounts = {};
  let queryWeights = {}

  let max = 0
  console.log(words)
  words.forEach(word => {
    wordCounts[word] = !wordCounts[word] ? 1 : wordCounts[word] + 1
    max = Math.max(max, wordCounts[word])
  });


  for (word of Object.keys(wordCounts)) {
    let weight = .5 * wordCounts[word] / max;
    var logDoc = database.collection("logDocFreq");

    let doc = await logDoc.findOne({ "_id": 4 })//word})
    let logInv = doc != null ? doc.logInv : 0;
    weight = .5 + (weight * logInv);
    queryWeights[word] = weight
  }

  console.log(wordCounts, queryWeights)

  console.log('query: ' + query)

  var uuid = Math.random();

  let stemmed_words = Object.keys(wordCounts)

  var mapFnNum = function map() {
    var word = this.wordId;
    let queryWeight = !queryWeights[word] ? 0 : queryWeights[word]
    var wordWeight = queryWeight * this.tfidf;
    let res = {
      wordWeight,
      tfidf: this.tfidf,
      wt: queryWeight
    }
    emit(this.docId, res);
  };
  var reduceFnNum = function reduce(docId, values) {
    let res = { wordWeight: 0, tfidf: 0, wt: 0 }
    for (val of values) {
      res.wordWeight += val.wordWeight
      res.tfidf += Math.pow(val.tfidf, 2)
      res.wt += Math.pow(val.wt, 2)
    };

    res.tfidf = Math.sqrt(res.tfidf)
    res.wt = Math.sqrt(res.wt)
    res.wordWeight = res.wordWeight / (res.tfidf * res.wt)
    return res
  };
  let res = await database.collection('tfidf').mapReduce(
    mapFnNum,
    reduceFnNum,
    {
      scope: { queryWeights },
      out: "mrExampleNum" + uuid,
      // out: {inline:1},
      query: { wordId: { $in: stemmed_words } }
    }
  )

  console.log(res)

  var mrNum = database.collection("mrExampleNum" + uuid);

  await mrNum.aggregate([
    {
      $lookup: {
        from: "pageranks",
        localField: "_id",
        foreignField: "url_id",
        as: "pagerank"
      }
    },
    {
      $project: {
        value: 1,
        pagerank: { $arrayElemAt: ["$pagerank.pagerank", 0] }
      }
    },
    {
      $project: {
        value: 1,
        pagerank: 1,
        "rank": { $add: ["$value.wt", "$pagerank"] }
      }
    },
    { $sort: { "rank": -1 } },
    { $limit: 30 },
    { $out: "mrExampleNum" + uuid }
  ]).toArray()

  // first merge with the actual site content
  return mrNum.aggregate([
    {
      $lookup: {
        from: "web_pages",
        localField: "_id",
        foreignField: "url.url_id",
        as: "web_pages"
      }
    },
    {
      $project: {
        value: 1,
        pagerank: 1,
        rank: 1,
        doc: { $arrayElemAt: ["$web_pages", 0] }
      }
    },
    {
      $lookup: {
        from: "web_document",
        localField: "doc.doc_id",
        foreignField: "doc_id",
        as: "pagecontent"
      },
    },
    { $sort: { "rank": -1 } },
    { $limit: 30 },
    {
      $project: {
        "doc": 1,
        "rank": 1,
        pagecontent: { $arrayElemAt: ["$pagecontent", 0] },
      }
    },
    {
      $project: {
        "pagecontent.content": 0,
      }
    },

    //TODO: @Neil, not sure how the js variables work, can we store this as a var or need to output to a collection?
    //     , { $out: { db: database, coll: "results"+uuid } }
  ]).toArray().then(res => {
    mrNum.drop();
    return res
  });
}

const exampleDB = function (param) {
  // todo replace this with some code that returns a promise
  return Promise.resolve("EXAMPLE: " + param)
}


module.exports = { search }
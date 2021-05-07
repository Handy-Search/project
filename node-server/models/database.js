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
    // console.log((await search("civic organ hello")))
  })
  .catch(console.log)



async function search(query) {
  const database = client.db('handy_search');
  const docFreqs = database.collection('docFreq')

  var queryClean = query.replace("/[^a-zA-Z0-9\s]/g", "");
  var words = queryClean.split(" ");
  var stem = Stemmer.newStemmer('english');
  words = words.map(word => stem.stem(word.toLowerCase()));

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

    let doc = await logDoc.findOne({ "_id": word})
    let logInv = doc != null ? doc.logInv : 0;
    // console.log(doc, logInv)
    weight = .5 + (weight * logInv);
    queryWeights[word] = weight
  }

  // console.log(wordCounts, queryWeights)

  console.log('query: ' + query)

  // TODO: do the mongodb query here!
  //  var uuid = 1;
  var uuid = Math.random();

  let stemmed_words = Object.keys(wordCounts)

  var mapFnNum = function map() {
    if (!this.word_tfidf) return
    for (let i = 0; i < this.word_tfidf.length; i++) {

      let wtfidf = this.word_tfidf[i]
      var word = wtfidf.wordId;
      if (stemmed_words.includes(word)) {
        let queryWeight = !queryWeights[word] ? 0 : queryWeights[word]
        var wordWeight = queryWeight * wtfidf.tfidf;
        let res = {
          pagerank: this.pagerank,
          wordWeight: wordWeight,
          tfidf: wtfidf.tfidf,
          wt: queryWeight
        }
        emit(this._id, res);
      }
    }
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
    res.pagerank = values[0].pagerank
    return res
  };
  function finalize(key, res) {
    return res.wordWeight + res.pagerank
  }
  // let res = await database.collection('testTfidfPr').mapReduce(
  //   mapFnNum,
  //   reduceFnNum,
  //   {
  //     finalize,
  //     scope: { queryWeights, stemmed_words },
  //     out: "mrExampleNum" + uuid,
  //     // sort: { _id : -1 },
  //     // out: { inline: 1 },
  //     query: { word_tfidf: { $elemMatch: { wordId: { $in: stemmed_words } } } }
  //   }
  // )

  /*
  {
    _id: -2141564717,
    word_tfidf: {
      _id: 6092960f38fc0c7b15351555,
      docId: -2141564717,
      wordId: 'organ',
      tfidf: -0.15824234315204463
    },
    pagerank: 0.703
  }
  */
  return database.collection('testTfidfPr').aggregate([
    { $unwind: "$word_tfidf" },
    { $match: { "word_tfidf.wordId": { $in: stemmed_words } } },
    { $project: {
      wt: {
        $function: {
          body: `function(word, queryWeights) {
            let queryWeight = !queryWeights[word] ? 0 : queryWeights[word]
            return queryWeight;
          }`,
          args: [ "$word_tfidf.wordId", queryWeights ],
          lang: "js"
        }
      },
      pagerank: "$pagerank",
      tfidf: "$word_tfidf.tfidf",
    } },
    { $addFields: {
      wordWeight: { $multiply: ["$wt", "$tfidf"] }
    }},
    { $group: {
      _id: "$_id",
      pagerank: { $first: "$pagerank" },
      wordWeight: {$sum : "$wordWeight"},
      wt: {$sum : {$pow : ["$wt", 2]}},
      tfidf: {$sum : {$pow : ["$tfidf", 2]}}
    }},
    { $set: {
      wt: { $sqrt : "$wt"},
      tfidf: { $sqrt : "$wt"},
    }},
    { $project: {
      rank: { $add : ["$pagerank", {$divide: ["$wordWeight", {$multiply: ["$tfidf", "$wt"]}]}]}
    }},
    { $sort : {rank : -1}},
    { $limit: 30 },
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
    }
  ]).toArray()
  // console.log(res)

  /*
    db.testTfidfPr.findOne({word_tfidf : {
      $elemMatch:{ wordId : {$in: ["awards"]}}
    }})

  */

  // return
  // var mrNum = database.collection("mrExampleNum" + uuid);

  // return mrNum.aggregate([
  //   { $sort: { value: -1 } },
  //   { $limit: 30 },
  //   {
  //     $lookup: {
  //       from: "web_pages",
  //       localField: "_id",
  //       foreignField: "url.url_id",
  //       as: "web_pages"
  //     }
  //   },
  //   {
  //     $project: {
  //       value: 1,
  //       pagerank: 1,
  //       rank: 1,
  //       doc: { $arrayElemAt: ["$web_pages", 0] }
  //     }
  //   },
  //   {
  //     $lookup: {
  //       from: "web_document",
  //       localField: "doc.doc_id",
  //       foreignField: "doc_id",
  //       as: "pagecontent"
  //     },
  //   },
  //   { $sort: { "rank": -1 } },
  //   { $limit: 30 },
  //   {
  //     $project: {
  //       "doc": 1,
  //       "rank": 1,
  //       pagecontent: { $arrayElemAt: ["$pagecontent", 0] },
  //     }
  //   },
  //   {
  //     $project: {
  //       "pagecontent.content": 0,
  //     }
  //   },
  // ]).toArray().then(res => {
  //   mrNum.drop();
  //   return res
  // });

}

const exampleDB = function (param) {
  // todo replace this with some code that returns a promise
  return Promise.resolve("EXAMPLE: " + param)
}


module.exports = { search }
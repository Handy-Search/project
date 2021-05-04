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
    console.log(await search("green fox phone"))
  })
  .catch(console.log)

function countWords(wordCounts) {


}



async function search(query) {
  const database = client.db('indexDBTest');
  const docFreqs = database.collection('docFreq')

  var queryClean = query.replace("/[^a-zA-Z0-9\s]/g", "");
  var words = query.split(" ");
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
    // console.log(doc, logInv)
    weight = .5 + (weight * logInv);
    queryWeights[word] = weight
  }

  // console.log(wordCounts, queryWeights)

  // TODO @Neil, it would be easiest to pass in a map from Java with each word
  // of the query and it's "weight".  Is that possible?
  console.log('query: ' + query)

  // TODO: do the mongodb query here!
  //  var uuid = 1;
  var uuid = Math.random();

  let stemmed_words = Object.keys(wordCounts)
  // let res = await database.collection('tfidf').find(
  //   { wordId: { $in: [1, 4] } },
  //   { "tfidf": 1, "wordId": 1, "docId": 1 }
  // )

  // { $out: { db: database, coll: "tfidf5" } }
  // res.next()

  // var qtfidf = database.collection("tfidf" + uuid);

  // cosine sim numerator
  queryWeights = { green: 0.3, fox: 0.5, phone: 0.8 }
  console.log(queryWeights)
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
  let res = await database.collection('tfidf2').mapReduce(
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

  //TODO @Neil, just a flag to make sure this is set up correctly with the async and parameters, etc
  async function updateFieldName(from, to, collection) {
    const result = await collection.updateMany([
      {},
      { $set: { [to]: "$" + from } }
    ]);
  }
  // docId is set to "_id" after mapreduce
  updateFieldName("_id", "docId", mrNum);

  var pagerank = database.collection("pagerank");
  //TODO @Neil, can we now do a lookup on results (ie, top thirty results) instead of all of mrNum? (line138)
  const results = await db.pagerank.aggregate([
    { $merge: { into: { db: database, coll: mrNum }, on: "docId" } },
    { $project: { "pageScore": { $add: ["$wt", "$pagerank"] } } },
    { $sort: { "mrOut": -1 } },
    { $limit: 30 }
  ]);
  var sites = database.collection("sites");
  // db.results.aggregate( [
  return mrNum.aggregate([
    {
      $lookup: {
        from: "sites",
        localField: "docId",
        foreignField: "docId",
        as: "queryResults"
      }
    }
    //TODO: @Neil, not sure how the js variables work, can we store this as a var or need to output to a collection
    // to pass back to UI?
    //     , { $out: { db: database, coll: "results"+uuid } }
  ]).then(res => {
    mrNum.drop();
    return res
  });

  // mrNum.aggregate([
  //   { $sort: { "mrOut": -1 } },
  //   { $limit: 30 }
  // ]);
  // var sites = database.collection("sites");
  // db.mrNum.aggregate([
  //   {
  //     $lookup: {
  //       from: "sites",
  //       localField: "_id",
  //       foreignField: "docId",
  //       as: "queryResults"
  //     }
  //   }
  //   //     , { $out: { db: database, coll: "results"+uuid } }
  // ]);


}

const exampleDB = function (param) {
  // todo replace this with some code that returns a promise
  return Promise.resolve("EXAMPLE: " + param)
}


module.exports = { search }
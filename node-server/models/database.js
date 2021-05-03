const { MongoClient } = require("mongodb");
const Stemmer = require("snowball-stemmers");
// Replace the uri string with your MongoDB deployment's connection string.
const uri =
  "mongodb+srv://handy:search@cluster0.4azy8.mongodb.net";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect()
  .then(() => {
    console.log("mongodb connected!")
    search("hello world hello there world world")
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
  let res = await database.collection('tfidf').aggregate([
    {
      $match: {
        wordId: { $in: [1, 4] } //TODO: change this to stemmed words
      }
    },
    { $project: { "tfidf": 1, "wordId": 1, "docId": 1 } },
  ]);
  // { $out: { db: database, coll: "tfidf5" } }
  res.next()
  return

  var qtfidf = database.collection("tfidf" + uuid);

  // cosine sim numerator
  var mapFnNum = function map() {
    var word = this.wordId;
    print(queryWeights);
    print(word);
    var wordWeight = queryWeights[word] * this.tfidf;
    emit(this.docId, wordWeight);
  };
  var reduceFnNum = function reduce(docId, queryWeights) {
    var sum = 0;
    for (var i = 0; i < queryWeights.length; i++) {
      sum = sum + queryWeights[i];
    };
    return sum;
  };
  db.qtfidf.mapReduce(
    mapFnNum,
    reduceFnNum,
    { out: "mrExampleNum" + uuid }
  )

  // doc weights in denom
  var mapFnDenomDoc = function map() {
    var word = this.wordId;
    print(word);
    var wordWeight = this.tfidf;
    emit(this.docId, wordWeight);
  };
  var reduceFnDenomDoc = function reduce(docId, queryWeights) {
    var sum = 0;
    for (var i = 0; i < queryWeights.length; i++) {
      sum = sum + Math.pow(queryWeights[i], 2);
    };
    return Math.sqrt(sum);
  };

  db.qtfidf.mapReduce(
    mapFnDenomDoc,
    reduceFnDenomDoc,
    { out: "mrExampleDenD" + uuid }
  )

  // query weights in denom
  var mapFnDenomQ = function map() {
    var word = this.wordId;
    print(word);
    var wordWeight = 0;
    if (queryWeights.has(word)) {
      wordWeight = queryWeights[word];
    }
    emit(this.docId, wordWeight);
  };
  var reduceFnDenomQ = function reduce(docId, queryWeights) {
    var sum = 0;
    for (var i = 0; i < queryWeights.length; i++) {
      sum = sum + Math.pow(queryWeights[i], 2);
    };
    return Math.sqrt(sum);
  };

  db.qtfidf.mapReduce(
    mapFnDenomQ,
    reduceFnDenomQ,
    { out: "mrExampleDenQ" + uuid }
  )

  var mrNum = database.collection("mrExampleNum" + uuid);
  var mrDenD = database.collection("mrExampleDenD" + uuid);
  var mrDenQ = database.collection("mrExampleDenQ" + uuid);

  mrNum.updateMany({}, { $rename: { "value": "mrNum" } });
  mrDenD.updateMany({}, { $rename: { "value": "mrDenD" } });
  mrDenQ.updateMany({}, { $rename: { "value": "mrDenQ" } });

  db.mrDenD.aggregate([
    { $merge: { into: { db: database, coll: mrDenQ }, on: "_id" } }
  ]);
  db.mrDenQ.aggregate([
    { $project: { "mrDenD": 1, "mrDenQ": 1, "mrDen": { $multiply: ["$mrDenD", "$mrDenQ"] } } },
    { $out: { db: database, coll: mrDenQ } }
  ]);
  db.mrDenQ.aggregate([
    { $merge: { into: { db: database, coll: mrNum }, on: "_id" } }
  ]);
  db.mrNum.aggregate([
    { $project: { "mrNum": 1, "mrDenQ": 1, "mrDenD": 1, "mrDen": 1, "mrOut": { $divide: ["$mrNum", "$mrDen"] } } },
    // maybe combine with pagerank here and the sort and limit?
    // then combine with sites
    { $out: { db: database, coll: mrNum } }
  ]);

  //TODO combine with pagerank?
  db.mrNum.aggregate([
    { $sort: { "mrOut": -1 } },
    { $limit: 30 }
  ]);
  var sites = database.collection("sites");
  db.mrNum.aggregate([
    {
      $lookup: {
        from: "sites",
        localField: "_id",
        foreignField: "docId",
        as: "queryResults"
      }
    }
    //     , { $out: { db: database, coll: "results"+uuid } }
  ]);

  qtfidf.drop();
  mrNum.drop();
  mrDenD.drop();
  mrDenQ.drop();
  db.close();


  //return the result of the query!
  //TODO what do we actually want to return and where does it go? back to java and then paginated result?
  return docFreqs.findOne()
}

const exampleDB = function (param) {
  // todo replace this with some code that returns a promise
  return Promise.resolve("EXAMPLE: " + param)
}


module.exports = { search }
const { MongoClient } = require("mongodb");
// Replace the uri string with your MongoDB deployment's connection string.
const uri =
  "mongodb+srv://handy:search@cluster0.4azy8.mongodb.net";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect()
  .then(() => console.log("mongodb connected!"))
  .catch(console.log)

function search(query) {
  const database = client.db('indexDBTest');
  const docFreqs = database.collection('docFreq')

  // TODO @Neil, it would be easiest to pass in a map from Java with each word
  // of the query and it's "weight".  Is that possible?
  console.log('query: ' + query)

  // TODO: do the mongodb query here!
//  var uuid = 1;
  var uuid = Math.random();

  // cosine sim numerator
  var mapFnNum = function map() {
      var word = this.wordId;
      print(queryWeights);
      print(word);
      var wordWeight = queryWeights[word] * this.tfidf;
      emit(this.docId, wordWeight);
      };
  var reduceFnNum = function reduce(docId, wordWeights) {
      var sum = 0;
      for (var i = 0; i < wordWeights.length; i++){
         sum = sum + wordWeights[i];
      };
      return sum;
      };
  db.tfidf2.mapReduce(
      mapFnNum,
      reduceFnNum,
      { out: "mrExampleNum" + uuid}
      )

  // doc weights in denom
  var mapFnDenomDoc = function map() {
      var word = this.wordId;
      print(word);
      var wordWeight = this.tfidf;
      emit(this.docId, wordWeight);
      };
  var reduceFnDenomDoc = function reduce(docId, wordWeights) {
      var sum = 0;
      for (var i = 0; i < wordWeights.length; i++){
         sum = sum + Math.pow(wordWeights[i], 2);
      };
      return Math.sqrt(sum);
      };

  db.tfidf2.mapReduce(
      mapFnDenomDoc,
      reduceFnDenomDoc,
      { out: "mrExampleDenD" + uuid}
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
  var reduceFnDenomQ = function reduce(docId, wordWeights) {
      var sum = 0;
      for (var i = 0; i < wordWeights.length; i++){
         sum = sum + Math.pow(wordWeights[i], 2);
      };
      return Math.sqrt(sum);
      };

  db.tfidf2.mapReduce(
      mapFnDenomQ,
      reduceFnDenomQ,
      { out: "mrExampleDenQ" + uuid}
      )

   var mrNum = db.collection("mrExampleNum" + uuid);
   var mrDenD = db.collection("mrExampleDenD" + uuid);
   var mrDenQ = db.collection("mrExampleDenQ" + uuid);

   mrNum.updateMany( {}, {$rename: {"value" : "mrNum"}});
   mrDenD.updateMany( {}, {$rename: {"value" : "mrDenD"}});
   mrDenQ.updateMany( {}, {$rename: {"value" : "mrDenQ"}});

  db.mrDenD.aggregate( [
     { $merge : { into: { db: "indexDB", coll: mrDenQ }, on: "_id"} }
  ] );
  db.mrDenQ.aggregate( [
     { $project : { "mrDenD": 1, "mrDenQ": 1,  "mrDen" : { $multiply: ["$mrDenD", "$mrDenQ"] }}},
     { $out: { db: database, coll: mrDenQ } }
  ] );
  db.mrDenQ.aggregate( [
     { $merge : { into: { db: "indexDB", coll: mrNum}, on: "_id"} }
  ] );
  db.mrNum.aggregate( [
     { $project : { "mrNum": 1, "mrDenQ": 1, "mrDenD" : 1,  "mrDen" : 1, "mrOut" : { $divide: ["$mrNum", "$mrDen"] }}},
     { $out: { db: database, coll: mrNum } }
  ] );

  //TODO combine with pagerank?

  mrNum.drop();
  mrDenD.drop();
  mrDenQ.drop();
  db.close();


  //return the result of the query!
  //TODO what do we actually want to return and where does it go? back to java and then paginated result?
  return docFreqs.findOne()
}

const exampleDB = function(param) {
  // todo replace this with some code that returns a promise
  return Promise.resolve("EXAMPLE: " + param)
}


module.exports = { search }
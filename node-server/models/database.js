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

  console.log('query: ' + query)

  // TODO: do the mongodb query here!


  //return the result of the query!
  return docFreqs.findOne()
}

const exampleDB = function(param) {
  // todo replace this with some code that returns a promise
  return Promise.resolve("EXAMPLE: " + param)
}


module.exports = { search }
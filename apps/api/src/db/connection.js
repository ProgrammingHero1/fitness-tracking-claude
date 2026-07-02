const { MongoClient } = require('mongodb');

let clientPromise;

function getClientPromise() {
  if (!clientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not set');
    }
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

async function getDb() {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB_NAME);
}

module.exports = { getDb, getClientPromise };

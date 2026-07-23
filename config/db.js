const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dominion_softwares';
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    try {
      console.log('Local MongoDB offline, starting In-Memory MongoDB instance...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`MongoDB Connected (In-Memory Database): ${conn.connection.host}`);
    } catch (memErr) {
      console.warn(`\x1b[33m[MongoDB Warning] Could not connect to MongoDB: ${error.message}\x1b[0m`);
      console.warn(`\x1b[33m[MongoDB Warning] Set MONGODB_URI in .env to connect to your MongoDB Atlas or local MongoDB instance.\x1b[0m`);
    }
  }
};

module.exports = connectDB;


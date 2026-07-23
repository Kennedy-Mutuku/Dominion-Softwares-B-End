const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dominion_softwares';
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`\x1b[33m[MongoDB Warning] Could not connect to MongoDB: ${error.message}\x1b[0m`);
    console.warn(`\x1b[33m[MongoDB Warning] Set MONGODB_URI in .env to connect to your MongoDB Atlas or local MongoDB instance.\x1b[0m`);
  }
};

module.exports = connectDB;

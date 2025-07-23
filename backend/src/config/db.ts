import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/menubot';
console.log('Connecting to MongoDB at:', MONGO_URI);

export const connectToDb = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      family: 4,
    });
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1); 
  }
};

import mongoose from 'mongoose';
import dotenv from 'dotenv';

const nodeEnv = process.env.NODE_ENV || "development";
const envPath = `.env.${nodeEnv}`;
dotenv.config({ path: envPath });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/realitycheque';

export const connectToDb = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      family: 4,
    });
    console.log('Database connected at: ', MONGO_URI);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1); 
  }
};

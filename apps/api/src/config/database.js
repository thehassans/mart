import mongoose from 'mongoose';

export async function connectDatabase(connectionString) {
  if (!connectionString) {
    throw new Error('A MongoDB connection string environment variable is required before starting the API server. Supported keys: MONGODB_URI, MONGODB_UR, MONGO_URI, MONGO_URL, DATABASE_URL.');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(connectionString, {
    autoIndex: true,
    family: 4,
    serverSelectionTimeoutMS: 10000,
  });

  return mongoose.connection;
}

export function getDatabaseConnection() {
  return mongoose.connection;
}

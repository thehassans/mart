import mongoose from 'mongoose';

export async function connectDatabase(connectionString) {
  if (!connectionString) {
    throw new Error('MONGODB_URI is required before starting the API server.');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(connectionString, {
    autoIndex: true,
    serverSelectionTimeoutMS: 3000,
  });

  return mongoose.connection;
}

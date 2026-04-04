import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';

dotenv.config();

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

const port = Number(process.env.PORT || 5000);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const jwtSecret = process.env.JWT_SECRET || 'development-only-jwt-secret';
const mongoUri = process.env.MONGODB_URI;
const staticAssetsPath = path.resolve(currentDirectory, '../../web/dist');
const shouldServeStaticApp = process.env.NODE_ENV === 'production' && existsSync(staticAssetsPath);

async function startServer() {
  let databaseReady = false;

  try {
    await connectDatabase(mongoUri);
    databaseReady = true;
  } catch (error) {
    console.warn('MongoDB connection unavailable. Starting API in demo mode.', error.message);
  }

  const app = createApp({
    clientOrigin,
    jwtSecret,
    databaseReady,
    staticAssetsPath: shouldServeStaticApp ? staticAssetsPath : null,
  });

  app.listen(port, () => {
    console.log(`Buysial ERP API listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start Buysial ERP API:', error);
  process.exit(1);
});

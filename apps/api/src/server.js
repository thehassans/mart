import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { connectDatabase, getDatabaseConnection } from './config/database.js';

dotenv.config();

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

const port = Number(process.env.PORT || 5000);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const jwtSecret = process.env.JWT_SECRET || 'development-only-jwt-secret';
const mongoUri = process.env.MONGODB_URI;
const allowDemoFallback = process.env.NODE_ENV !== 'production';
const databaseRetryIntervalMs = Math.max(5000, Number(process.env.DATABASE_RETRY_INTERVAL_MS || 30000));
const staticAssetsPath = path.resolve(currentDirectory, '../../web/dist');
const shouldServeStaticApp = process.env.NODE_ENV === 'production' && existsSync(staticAssetsPath);

function setDatabaseStatus(app, databaseReady, databaseErrorMessage = '') {
  app.locals.databaseReady = Boolean(databaseReady);
  app.locals.databaseErrorMessage = String(databaseErrorMessage || '');
  app.locals.databaseLastUpdatedAt = new Date().toISOString();
}

function attachDatabaseConnectionObservers(app) {
  const databaseConnection = getDatabaseConnection();

  databaseConnection.on('connected', () => {
    setDatabaseStatus(app, true, '');
  });

  databaseConnection.on('reconnected', () => {
    setDatabaseStatus(app, true, '');
  });

  databaseConnection.on('disconnected', () => {
    setDatabaseStatus(app, false, app.locals.databaseErrorMessage || 'MongoDB connection disconnected.');
  });

  databaseConnection.on('error', (error) => {
    setDatabaseStatus(app, false, error.message || 'MongoDB connection error.');
  });
}

function startDatabaseReconnectLoop(app) {
  let isConnecting = false;

  async function attemptConnection() {
    if (isConnecting || app.locals.databaseReady) {
      return;
    }

    if (!mongoUri) {
      setDatabaseStatus(app, false, 'MONGODB_URI is required before starting the API server.');
      return;
    }

    isConnecting = true;

    try {
      await connectDatabase(mongoUri);
      setDatabaseStatus(app, true, '');
    } catch (error) {
      const message = error.message || 'MongoDB connection unavailable.';
      setDatabaseStatus(app, false, message);
      console.warn(`MongoDB connection unavailable. Retrying in ${databaseRetryIntervalMs}ms.`, message);
    } finally {
      isConnecting = false;
    }
  }

  const retryTimer = setInterval(() => {
    void attemptConnection();
  }, databaseRetryIntervalMs);
  retryTimer.unref?.();

  if (!app.locals.databaseReady) {
    void attemptConnection();
  }
}

async function startServer() {
  let databaseReady = false;
  let databaseErrorMessage = '';

  try {
    await connectDatabase(mongoUri);
    databaseReady = true;
  } catch (error) {
    databaseErrorMessage = error.message || 'MongoDB connection unavailable.';
    console.warn(`MongoDB connection unavailable. Starting API with databaseReady=false and allowDemoFallback=${allowDemoFallback}.`, databaseErrorMessage);
  }

  const app = createApp({
    clientOrigin,
    jwtSecret,
    databaseReady,
    databaseErrorMessage,
    allowDemoFallback,
    staticAssetsPath: shouldServeStaticApp ? staticAssetsPath : null,
  });

  attachDatabaseConnectionObservers(app);
  startDatabaseReconnectLoop(app);

  app.listen(port, () => {
    console.log(`Buysial ERP API listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start Buysial ERP API:', error);
  process.exit(1);
});

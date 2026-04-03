import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import path from 'node:path';
import { createAnalyticsRouter } from './routes/analytics.routes.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createProductsRouter } from './routes/products.routes.js';
import { systemRouter } from './routes/system.routes.js';
import { createTenantRouter } from './routes/tenant.routes.js';

export function createApp({ clientOrigin, jwtSecret, databaseReady = false, staticAssetsPath = null }) {
  const app = express();
  app.locals.databaseReady = databaseReady;

  app.use(
    cors({
      origin: clientOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '6mb' }));
  app.use(morgan('dev'));

  app.get('/api', (_req, res) => {
    res.json({
      message: 'Buysial ERP API is running.',
      databaseReady: app.locals.databaseReady,
    });
  });

  app.use('/api', systemRouter);
  app.use('/api/auth', createAuthRouter({ jwtSecret }));
  app.use('/api/analytics', createAnalyticsRouter({ jwtSecret }));
  app.use('/api/products', createProductsRouter({ jwtSecret }));
  app.use('/api/tenants', createTenantRouter({ jwtSecret }));

  if (staticAssetsPath) {
    app.use(express.static(staticAssetsPath));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }

      return res.sendFile(path.join(staticAssetsPath, 'index.html'));
    });
  }

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({
      message: error.message || 'Unexpected API error.',
    });
  });

  return app;
}

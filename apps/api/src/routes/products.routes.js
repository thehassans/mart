import { Router } from 'express';
import mongoose from 'mongoose';
import { BUSINESS_TYPES, USER_ROLES } from '@vitalblaze/shared';
import { authenticateJwt, authorizeRoles, enforceTenantScope } from '../middleware/auth.js';
import {
  createCatalogProduct,
  fetchOpenFoodFactsProduct,
  listCatalogProducts,
  resolveCatalogBarcode,
} from '../services/catalog.js';
import {
  discoverMarketImportCategoryUrls,
  getSupportedMarketImportSources,
  importMarketPreviewToCatalog,
  previewMarketImport,
  syncMarketImportToCatalog,
} from '../services/marketCatalogImport.js';

function resolveSupportedBusinessType(value) {
  return Object.values(BUSINESS_TYPES).includes(value) ? value : BUSINESS_TYPES.GROCERY_STORE;
}

export function createProductsRouter({ jwtSecret }) {
  const router = Router();

  router.get('/import-sources', authenticateJwt({ secret: jwtSecret }), authorizeRoles(USER_ROLES.SUPER_ADMIN, USER_ROLES.STORE_ADMIN, USER_ROLES.MANAGER), async (_req, res, next) => {
    try {
      return res.json({
        sources: getSupportedMarketImportSources(),
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/import-categories', authenticateJwt({ secret: jwtSecret }), authorizeRoles(USER_ROLES.SUPER_ADMIN, USER_ROLES.STORE_ADMIN, USER_ROLES.MANAGER), async (req, res, next) => {
    try {
      const sourceKey = String(req.query.sourceKey || 'tamimi').trim();

      return res.json({
        sourceKey,
        categoryUrls: await discoverMarketImportCategoryUrls(sourceKey),
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const tenantId = String(req.query.tenantId || '').trim();
      const businessType = resolveSupportedBusinessType(req.query.businessType);
      const search = String(req.query.search || '').trim();
      const databaseReady = Boolean(req.app.locals.databaseReady);
      const databaseErrorMessage = String(req.app.locals.databaseErrorMessage || '').trim();
      const allowDemoFallback = req.app.locals.allowDemoFallback !== false;
      const products = await listCatalogProducts({
        databaseReady,
        allowDemoFallback,
        tenantId,
        businessType,
        search,
      });

      const source = databaseReady && tenantId ? 'database' : allowDemoFallback ? 'demo' : 'unavailable';

      return res.json({
        products,
        filters: {
          tenantId,
          businessType,
          search,
        },
        databaseReady,
        databaseErrorMessage,
        allowDemoFallback,
        source,
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/resolve-barcode', async (req, res, next) => {
    try {
      const tenantId = String(req.query.tenantId || '').trim();
      const businessType = resolveSupportedBusinessType(req.query.businessType);
      const barcode = String(req.query.barcode || '').trim();
      const databaseReady = Boolean(req.app.locals.databaseReady);
      const databaseErrorMessage = String(req.app.locals.databaseErrorMessage || '').trim();
      const allowDemoFallback = req.app.locals.allowDemoFallback !== false;

      if (!barcode) {
        return res.status(400).json({ message: 'Barcode is required for product resolution.' });
      }

      const resolution = await resolveCatalogBarcode({
        barcode,
        databaseReady,
        allowDemoFallback,
        tenantId,
        businessType,
      });

      if (!resolution) {
        return res.status(404).json({ message: 'No product matched the supplied barcode.' });
      }

      return res.json({
        resolution,
        databaseReady,
        databaseErrorMessage,
        allowDemoFallback,
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/enrich/barcode/:barcode', async (req, res, next) => {
    try {
      const enrichment = await fetchOpenFoodFactsProduct(req.params.barcode);

      if (!enrichment) {
        return res.status(404).json({
          message: 'No free enrichment data was found for this barcode.',
          source: 'open_food_facts',
        });
      }

      return res.json({
        product: enrichment,
        source: 'open_food_facts',
      });
    } catch (error) {
      return res.status(502).json({
        message: error.message || 'Unable to fetch free enrichment right now.',
        source: 'open_food_facts',
      });
    }
  });

  router.post(
    '/import/preview',
    authenticateJwt({ secret: jwtSecret }),
    authorizeRoles(USER_ROLES.SUPER_ADMIN, USER_ROLES.STORE_ADMIN, USER_ROLES.MANAGER),
    async (req, res, next) => {
      try {
        if (!req.app.locals.databaseReady) {
          return res.status(503).json({ message: req.app.locals.databaseErrorMessage || 'Market import preview is unavailable because MongoDB is not connected.' });
        }

        const payload = req.body || {};
        const preview = await previewMarketImport({
          sourceKey: payload.sourceKey,
          categoryUrls: payload.categoryUrls,
          maxProducts: payload.maxProducts,
          enrichProducts: payload.enrichProducts !== false,
          detailEnrichmentLimit: payload.detailEnrichmentLimit,
        });

        if (!payload.persistToCatalog) {
          return res.json({
            preview,
          });
        }

        const tenantId = String(payload.tenantId || '').trim();

        if (!tenantId) {
          return res.status(400).json({ message: 'tenantId is required to import previewed products into the catalog.' });
        }

        if (!mongoose.isValidObjectId(tenantId)) {
          return res.status(400).json({ message: 'tenantId must be a valid MongoDB ObjectId.' });
        }

        if (req.auth?.role !== USER_ROLES.SUPER_ADMIN && String(req.auth?.tenantId || '') !== tenantId) {
          return res.status(403).json({ message: 'Tenant scope violation detected.' });
        }

        const summary = await importMarketPreviewToCatalog({
          tenantId,
          preview,
          defaultVatRate: payload.defaultVatRate,
          allowUpdate: payload.allowUpdate !== false,
        });

        return res.json({
          preview,
          summary,
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  router.post(
    '/import/sync',
    authenticateJwt({ secret: jwtSecret }),
    authorizeRoles(USER_ROLES.SUPER_ADMIN, USER_ROLES.STORE_ADMIN, USER_ROLES.MANAGER),
    enforceTenantScope({ source: 'body', key: 'tenantId' }),
    async (req, res, next) => {
      try {
        if (!req.app.locals.databaseReady) {
          return res.status(503).json({ message: req.app.locals.databaseErrorMessage || 'Market import sync is unavailable because MongoDB is not connected.' });
        }

        const payload = req.body || {};
        const summary = await syncMarketImportToCatalog({
          tenantId: payload.tenantId,
          sourceKey: payload.sourceKey,
          categoryUrls: payload.categoryUrls,
          maxProducts: payload.maxProducts,
          enrichProducts: payload.enrichProducts !== false,
          detailEnrichmentLimit: payload.detailEnrichmentLimit,
          defaultVatRate: payload.defaultVatRate,
          allowUpdate: payload.allowUpdate !== false,
        });

        return res.status(201).json({
          summary,
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  router.post(
    '/',
    authenticateJwt({ secret: jwtSecret }),
    authorizeRoles(USER_ROLES.SUPER_ADMIN, USER_ROLES.STORE_ADMIN, USER_ROLES.MANAGER),
    enforceTenantScope({ source: 'body', key: 'tenantId' }),
    async (req, res, next) => {
      try {
        if (!req.app.locals.databaseReady) {
          return res.status(503).json({ message: req.app.locals.databaseErrorMessage || 'Product creation is unavailable because MongoDB is not connected.' });
        }

        const product = await createCatalogProduct(req.body || {});
        return res.status(201).json({ product });
      } catch (error) {
        return next(error);
      }
    }
  );

  router.post(
    '/import-from-barcode',
    authenticateJwt({ secret: jwtSecret }),
    authorizeRoles(USER_ROLES.SUPER_ADMIN, USER_ROLES.STORE_ADMIN, USER_ROLES.MANAGER),
    enforceTenantScope({ source: 'body', key: 'tenantId' }),
    async (req, res, next) => {
      try {
        if (!req.app.locals.databaseReady) {
          return res.status(503).json({ message: req.app.locals.databaseErrorMessage || 'Barcode import is unavailable because MongoDB is not connected.' });
        }

        const payload = req.body || {};
        const enrichment = await fetchOpenFoodFactsProduct(payload.barcode);

        if (!enrichment) {
          return res.status(404).json({ message: 'No free barcode enrichment data was found for this product.' });
        }

        const product = await createCatalogProduct({
          ...payload,
          sku: String(payload.sku || `GTIN-${enrichment.barcode}`).trim(),
          name: payload.name || enrichment.name,
          brand: payload.brand || enrichment.brand,
          imageUrl: payload.imageUrl || enrichment.imageUrl,
          barcode: payload.barcode || enrichment.barcode,
        });

        return res.status(201).json({
          product,
          enrichmentSource: enrichment.source,
          enrichment,
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}

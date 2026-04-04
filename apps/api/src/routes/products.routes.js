import { Router } from 'express';
import mongoose from 'mongoose';
import { PRODUCT_UNITS, USER_ROLES, normalizeBarcode } from '@vitalblaze/shared';
import { Category, Product } from '../models/index.js';
import { authenticateJwt, authorizeRoles, enforceTenantScope } from '../middleware/auth.js';
import { lookupSaudiBarcodeCatalog } from '../services/catalog.js';

function trimString(value) {
  return String(value || '').trim();
}

function slugify(value) {
  return trimString(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function toFiniteNumber(value, fallback = null) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }
  }

  return fallback;
}

function toLocalizedValue(value, fallback = null) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const fallbackEn = trimString(fallback?.en || fallback?.ar);
    const fallbackAr = trimString(fallback?.ar || fallback?.en);
    const en = trimString(value.en || fallbackEn || fallbackAr);
    const ar = trimString(value.ar || fallbackAr || en);

    if (!en && !ar) {
      return null;
    }

    return { en, ar };
  }

  const normalized = trimString(value);
  const fallbackEn = trimString(fallback?.en || fallback?.ar);
  const fallbackAr = trimString(fallback?.ar || fallback?.en);
  const resolved = normalized || fallbackEn || fallbackAr;

  if (!resolved) {
    return null;
  }

  return {
    en: normalized || fallbackEn || fallbackAr,
    ar: fallbackAr || normalized || fallbackEn,
  };
}

function buildAutomaticSku({ brand, name, barcode }) {
  const brandToken = trimString(brand?.en || brand?.ar)
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 1)
    .join('')
    .toUpperCase();
  const nameToken = trimString(name?.en || name?.ar)
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join('-')
    .toUpperCase();
  const barcodeSuffix = trimString(barcode).slice(-5);

  return [brandToken, nameToken, barcodeSuffix || Date.now().toString().slice(-5)]
    .filter(Boolean)
    .join('-')
    .slice(0, 40);
}

function ensureDatabaseReady(app) {
  if (!app.locals.databaseReady) {
    const error = new Error('Database is not available. Product operations require MongoDB.');
    error.statusCode = 503;
    throw error;
  }
}

function mapProductDocument(product) {
  return {
    id: product._id,
    tenantId: product.tenantId,
    categoryId: product.categoryId?._id || product.categoryId,
    category: product.categoryId?.name || null,
    supplierId: product.supplierId,
    brand: product.brand,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    imageUrl: product.imageUrl,
    costPrice: product.costPrice,
    sellingPrice: product.sellingPrice,
    vatRate: product.vatRate,
    exciseTaxRate: product.exciseTaxRate,
    taxCategory: product.taxCategory,
    unit: product.unit,
    isWeighedItem: product.isWeighedItem,
    scaleBarcodePrefix: product.scaleBarcodePrefix,
    scaleItemCode: product.scaleItemCode,
    packedDate: product.packedDate,
    expiryDate: product.expiryDate,
    requiresExpiryTracking: product.requiresExpiryTracking,
    countryOfOrigin: product.countryOfOrigin,
    storageTemperature: product.storageTemperature,
    stockQuantity: product.stockQuantity,
    reorderLevel: product.reorderLevel,
    catalogSource: product.catalogSource,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

async function resolveCategoryId({ tenantId, categoryId, category }) {
  if (categoryId) {
    if (!mongoose.isValidObjectId(categoryId)) {
      throw new Error('categoryId must be a valid MongoDB ObjectId.');
    }

    const existingCategory = await Category.findOne({ _id: categoryId, tenantId });
    if (!existingCategory) {
      throw new Error('Category was not found for the supplied tenant.');
    }

    return existingCategory._id;
  }

  const localizedCategory = toLocalizedValue(category, { en: 'General Merchandise', ar: 'سلع عامة' });
  const slug = slugify(localizedCategory.en || localizedCategory.ar || 'general-merchandise') || 'general-merchandise';
  let existingCategory = await Category.findOne({ tenantId, slug });

  if (!existingCategory) {
    existingCategory = await Category.create({
      tenantId,
      name: localizedCategory,
      slug,
    });
  }

  return existingCategory._id;
}

function validateLookupTenantScope(req, tenantId) {
  if (!tenantId) {
    return;
  }

  if (!mongoose.isValidObjectId(tenantId)) {
    throw new Error('tenantId must be a valid MongoDB ObjectId.');
  }

  if (req.auth?.role !== USER_ROLES.SUPER_ADMIN && String(req.auth?.tenantId || '') !== String(tenantId)) {
    const error = new Error('Tenant scope violation detected.');
    error.statusCode = 403;
    throw error;
  }
}

export function createProductsRouter({ jwtSecret }) {
  const router = Router();

  router.get(
    '/catalog/lookup/:barcode',
    authenticateJwt({ secret: jwtSecret }),
    authorizeRoles(USER_ROLES.SUPER_ADMIN, USER_ROLES.STORE_ADMIN, USER_ROLES.MANAGER, USER_ROLES.CASHIER),
    async (req, res, next) => {
      try {
        const tenantId = trimString(req.query.tenantId);
        validateLookupTenantScope(req, tenantId);

        const lookup = await lookupSaudiBarcodeCatalog(req.params.barcode);
        let existingProduct = null;

        if (tenantId && req.app.locals.databaseReady) {
          existingProduct = await Product.findOne({ tenantId, barcode: lookup.barcode }).populate('categoryId').lean();
        }

        res.json({
          message: 'Barcode catalog lookup completed successfully.',
          lookup,
          existingProduct: existingProduct ? mapProductDocument(existingProduct) : null,
        });
      } catch (error) {
        if (/Barcode|tenantId/i.test(error.message || '')) {
          return res.status(error.statusCode || 400).json({ message: error.message });
        }

        return next(error);
      }
    }
  );

  router.get(
    '/',
    authenticateJwt({ secret: jwtSecret }),
    authorizeRoles(USER_ROLES.SUPER_ADMIN, USER_ROLES.STORE_ADMIN, USER_ROLES.MANAGER, USER_ROLES.CASHIER),
    enforceTenantScope({ source: 'query', key: 'tenantId' }),
    async (req, res, next) => {
      try {
        ensureDatabaseReady(req.app);

        const tenantId = req.query.tenantId;
        const includeInactive = req.query.includeInactive === 'true';
        const search = trimString(req.query.search);
        const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
        const criteria = { tenantId };

        if (!includeInactive) {
          criteria.isActive = true;
        }

        if (search) {
          const expression = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          criteria.$or = [
            { sku: expression },
            { barcode: expression },
            { 'name.en': expression },
            { 'name.ar': expression },
            { 'brand.en': expression },
            { 'brand.ar': expression },
          ];
        }

        const products = await Product.find(criteria).populate('categoryId').sort({ updatedAt: -1 }).limit(limit).lean();

        res.json({
          products: products.map((product) => mapProductDocument(product)),
        });
      } catch (error) {
        if (error.statusCode) {
          return res.status(error.statusCode).json({ message: error.message });
        }

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
        ensureDatabaseReady(req.app);

        const payload = req.body || {};
        const tenantId = payload.tenantId;
        const barcode = trimString(payload.barcode) ? normalizeBarcode(payload.barcode) : '';
        const shouldEnrichFromCatalog = payload.enrichFromCatalog !== false;
        const catalogLookup = barcode && shouldEnrichFromCatalog ? await lookupSaudiBarcodeCatalog(barcode) : null;
        const draft = catalogLookup?.draft || null;
        const name = toLocalizedValue(payload.name, draft?.name);

        if (!name?.en || !name?.ar) {
          return res.status(400).json({ message: 'Product name is required in at least one language.' });
        }

        const brand = toLocalizedValue(payload.brand, draft?.brand);
        const categoryId = await resolveCategoryId({
          tenantId,
          categoryId: payload.categoryId,
          category: payload.category || draft?.category,
        });
        const unit = Object.values(PRODUCT_UNITS).includes(payload.unit) ? payload.unit : draft?.unit || PRODUCT_UNITS.EACH;
        const costPrice = toFiniteNumber(payload.costPrice, null);
        const sellingPrice = toFiniteNumber(payload.sellingPrice, draft?.referencePrice ?? null);

        if (costPrice === null || costPrice < 0) {
          return res.status(400).json({ message: 'costPrice is required and must be zero or greater.' });
        }

        if (sellingPrice === null || sellingPrice < 0) {
          return res.status(400).json({ message: 'sellingPrice is required and must be zero or greater.' });
        }

        const product = await Product.create({
          tenantId,
          categoryId,
          supplierId: payload.supplierId || null,
          brand,
          name,
          sku: trimString(payload.sku) || buildAutomaticSku({ brand, name, barcode }),
          barcode,
          imageUrl: trimString(payload.imageUrl || draft?.imageUrl),
          costPrice,
          sellingPrice,
          vatRate: toFiniteNumber(payload.vatRate, draft?.vatRate ?? 15),
          exciseTaxRate: toFiniteNumber(payload.exciseTaxRate, draft?.exciseTaxRate ?? 0),
          taxCategory: trimString(payload.taxCategory || draft?.taxCategory) || 'STANDARD',
          unit,
          isWeighedItem: toBoolean(payload.isWeighedItem, false),
          scaleBarcodePrefix: trimString(payload.scaleBarcodePrefix || '20') || '20',
          scaleItemCode: trimString(payload.scaleItemCode),
          packedDate: payload.packedDate || null,
          expiryDate: payload.expiryDate || null,
          requiresExpiryTracking: toBoolean(payload.requiresExpiryTracking, draft?.requiresExpiryTracking ?? true),
          countryOfOrigin: trimString(payload.countryOfOrigin || draft?.countryOfOrigin),
          storageTemperature: trimString(payload.storageTemperature || draft?.storageTemperature),
          stockQuantity: toFiniteNumber(payload.stockQuantity, 0),
          reorderLevel: toFiniteNumber(payload.reorderLevel, 0),
          catalogSource: trimString(payload.catalogSource || draft?.catalogSource) || 'manual',
          isActive: toBoolean(payload.isActive, true),
        });
        const savedProduct = await Product.findById(product._id).populate('categoryId').lean();

        res.status(201).json({
          message: 'Product created successfully.',
          product: mapProductDocument(savedProduct || product.toObject()),
          catalogLookup,
        });
      } catch (error) {
        if (error.statusCode) {
          return res.status(error.statusCode).json({ message: error.message });
        }

        if (error.name === 'ValidationError' || error.code === 11000 || /Category|costPrice|sellingPrice|name|required|scope/i.test(error.message || '')) {
          return res.status(400).json({ message: error.message || 'Unable to create product.' });
        }

        return next(error);
      }
    }
  );

  return router;
}

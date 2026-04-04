import { BUSINESS_TYPES, PRODUCT_UNITS, resolveScaleBarcodeProduct } from '@vitalblaze/shared';
import { demoProducts } from '../../../web/src/data/demo.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';

function normalizeLocalizedText(value, fallback = '') {
  if (typeof value === 'string') {
    const text = value.trim() || fallback;
    return {
      en: text,
      ar: text,
    };
  }

  const english = String(value?.en || fallback || '').trim();
  const arabic = String(value?.ar || english || fallback || '').trim();

  return {
    en: english,
    ar: arabic,
  };
}

function normalizeDate(value) {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
}

function buildPlaceholderImage(label, accent = '#0f766e') {
  const displayLabel = String(label || 'Saudi Product')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(' ');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${accent}"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="320" height="320" rx="42" fill="url(#g)"/>
      <circle cx="252" cy="68" r="38" fill="rgba(255,255,255,0.16)"/>
      <rect x="34" y="42" width="112" height="112" rx="28" fill="rgba(255,255,255,0.18)"/>
      <text x="34" y="218" fill="#ffffff" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="700">${displayLabel}</text>
      <text x="34" y="260" fill="#e2e8f0" font-size="18" font-family="Arial, Helvetica, sans-serif">Free Catalog</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyBusinessTypeFilter(products, businessType) {
  if (businessType === BUSINESS_TYPES.BAKALA) {
    return products.filter((product) => !product.isWeighedItem);
  }

  return products;
}

function applySearchFilter(products, search) {
  const normalizedSearch = String(search || '').trim().toLowerCase();

  if (!normalizedSearch) {
    return products;
  }

  return products.filter((product) => {
    return [
      product.brand?.en,
      product.brand?.ar,
      product.name?.en,
      product.name?.ar,
      product.category?.en,
      product.category?.ar,
      product.sku,
      product.barcode,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });
}

function sortProducts(products) {
  return [...products].sort((left, right) => {
    return (left.name?.en || '').localeCompare(right.name?.en || '', 'en');
  });
}

function mapDemoProduct(product) {
  return {
    ...product,
    source: 'demo',
  };
}

function mapProductDocument(productDocument) {
  const id = productDocument.id || productDocument._id?.toString() || '';
  const brand = normalizeLocalizedText(productDocument.brand, '');
  const name = normalizeLocalizedText(productDocument.name, productDocument.sku || 'Saudi Product');
  const category = normalizeLocalizedText(productDocument.categoryId?.name || productDocument.category, 'General');
  const imageUrl = String(productDocument.imageUrl || '').trim() || buildPlaceholderImage(`${brand.en} ${name.en}`.trim() || name.en);

  return {
    id,
    tenantId: productDocument.tenantId?.toString?.() || String(productDocument.tenantId || ''),
    categoryId: productDocument.categoryId?._id?.toString?.() || String(productDocument.categoryId || ''),
    supplierId: productDocument.supplierId?.toString?.() || String(productDocument.supplierId || ''),
    businessTypes: productDocument.isWeighedItem ? [BUSINESS_TYPES.GROCERY_STORE] : [BUSINESS_TYPES.BAKALA, BUSINESS_TYPES.GROCERY_STORE],
    brand,
    name,
    category,
    sku: String(productDocument.sku || '').trim(),
    barcode: String(productDocument.barcode || '').trim(),
    costPrice: Number(productDocument.costPrice || 0),
    sellingPrice: Number(productDocument.sellingPrice || 0),
    vatRate: Number(productDocument.vatRate || 15),
    unit: productDocument.unit || (productDocument.isWeighedItem ? PRODUCT_UNITS.KG : PRODUCT_UNITS.EACH),
    isWeighedItem: Boolean(productDocument.isWeighedItem),
    scaleBarcodePrefix: String(productDocument.scaleBarcodePrefix || '').trim(),
    scaleItemCode: String(productDocument.scaleItemCode || '').trim(),
    packedDate: normalizeDate(productDocument.packedDate),
    expiryDate: normalizeDate(productDocument.expiryDate),
    requiresExpiryTracking: Boolean(productDocument.requiresExpiryTracking),
    stockQuantity: Number(productDocument.stockQuantity || 0),
    reorderLevel: Number(productDocument.reorderLevel || 0),
    isActive: productDocument.isActive !== false,
    imageUrl,
    source: 'database',
  };
}

function buildDemoCatalog({ businessType, search }) {
  const products = demoProducts.map(mapDemoProduct);
  return sortProducts(applySearchFilter(applyBusinessTypeFilter(products, businessType), search));
}

function sanitizeBarcode(barcode) {
  return String(barcode || '').replace(/\s+/g, '').trim();
}

export async function listCatalogProducts({ databaseReady, allowDemoFallback = true, tenantId, businessType, search = '' }) {
  if (!tenantId || !databaseReady) {
    if (!allowDemoFallback) {
      return [];
    }

    return buildDemoCatalog({ businessType, search });
  }

  const query = {
    tenantId,
    isActive: true,
  };

  if (businessType === BUSINESS_TYPES.BAKALA) {
    query.isWeighedItem = false;
  }

  if (String(search || '').trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), 'i');
    query.$or = [
      { sku: pattern },
      { barcode: pattern },
      { 'name.en': pattern },
      { 'name.ar': pattern },
      { 'brand.en': pattern },
      { 'brand.ar': pattern },
    ];
  }

  const products = await Product.find(query).populate('categoryId').sort({ 'name.en': 1, createdAt: 1 }).lean();
  return sortProducts(products.map(mapProductDocument));
}

export async function resolveCatalogBarcode({ barcode, databaseReady, allowDemoFallback = true, tenantId, businessType }) {
  const normalizedBarcode = sanitizeBarcode(barcode);

  if (!normalizedBarcode) {
    return null;
  }

  const products = await listCatalogProducts({ databaseReady, allowDemoFallback, tenantId, businessType });
  const directMatch = products.find((product) => product.barcode === normalizedBarcode);

  if (directMatch) {
    return {
      product: directMatch,
      quantity: 1,
      unitPrice: directMatch.sellingPrice,
      scalePayload: null,
    };
  }

  const resolved = resolveScaleBarcodeProduct(normalizedBarcode, products);

  if (!resolved?.product) {
    return null;
  }

  return {
    product: resolved.product,
    quantity: resolved.quantity,
    unitPrice: resolved.unitPrice,
    scalePayload: resolved.parsed,
  };
}

export async function fetchOpenFoodFactsProduct(barcode) {
  const normalizedBarcode = sanitizeBarcode(barcode).replace(/\D/g, '');

  if (!normalizedBarcode) {
    return null;
  }

  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${normalizedBarcode}.json?fields=code,product_name,product_name_ar,brands,image_front_url,image_url,categories,quantity,packaging,origins,countries`,
    {
      headers: {
        'User-Agent': 'Buysial ERP Free Catalog/0.1',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Open Food Facts lookup failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const product = payload?.product;

  if (payload?.status !== 1 || !product) {
    return null;
  }

  const primaryBrand = String(product.brands || '')
    .split(',')
    .map((value) => value.trim())
    .find(Boolean) || '';
  const primaryCategory = String(product.categories || '')
    .split(',')
    .map((value) => value.trim())
    .find(Boolean) || 'General';
  const resolvedName = String(product.product_name || primaryBrand || normalizedBarcode).trim();

  return {
    barcode: normalizedBarcode,
    name: {
      en: resolvedName,
      ar: String(product.product_name_ar || resolvedName).trim(),
    },
    brand: {
      en: primaryBrand,
      ar: primaryBrand,
    },
    category: {
      en: primaryCategory,
      ar: primaryCategory,
    },
    imageUrl: String(product.image_front_url || product.image_url || '').trim(),
    quantity: String(product.quantity || '').trim(),
    packaging: String(product.packaging || '').trim(),
    origin: String(product.origins || product.countries || '').trim(),
    source: 'open_food_facts',
    sourceUrl: `https://world.openfoodfacts.org/product/${normalizedBarcode}`,
  };
}

export async function createCatalogProduct(payload) {
  const normalizedPayload = {
    tenantId: payload.tenantId,
    categoryId: payload.categoryId,
    supplierId: payload.supplierId || null,
    name: normalizeLocalizedText(payload.name, payload.sku || 'Saudi Product'),
    brand: normalizeLocalizedText(payload.brand, ''),
    sku: String(payload.sku || '').trim(),
    barcode: sanitizeBarcode(payload.barcode),
    costPrice: Number(payload.costPrice || 0),
    sellingPrice: Number(payload.sellingPrice || 0),
    vatRate: Number(payload.vatRate ?? 15),
    unit: payload.unit || PRODUCT_UNITS.EACH,
    isWeighedItem: Boolean(payload.isWeighedItem),
    scaleBarcodePrefix: String(payload.scaleBarcodePrefix || '20').trim(),
    scaleItemCode: String(payload.scaleItemCode || '').trim(),
    packedDate: payload.packedDate || null,
    expiryDate: payload.expiryDate || null,
    requiresExpiryTracking: payload.requiresExpiryTracking ?? true,
    stockQuantity: Number(payload.stockQuantity || 0),
    reorderLevel: Number(payload.reorderLevel || 0),
    imageUrl: String(payload.imageUrl || '').trim(),
    isActive: payload.isActive ?? true,
  };

  const category = await Category.findById(normalizedPayload.categoryId).lean();

  if (!category) {
    throw new Error('Category not found for product creation.');
  }

  const product = await Product.create({
    ...normalizedPayload,
    barcode: normalizedPayload.barcode || undefined,
  });
  const createdProduct = await Product.findById(product._id).populate('categoryId').lean();

  return mapProductDocument(createdProduct);
}

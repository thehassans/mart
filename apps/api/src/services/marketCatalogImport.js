import { PRODUCT_UNITS } from '@vitalblaze/shared';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';

const TAMIMI_BASE_URL = 'https://shop.tamimimarkets.com';
const TAMIMI_CATEGORY_SITEMAP_URL = `${TAMIMI_BASE_URL}/sitemaps/category1.xml`;
const TAMIMI_DEFAULT_CATEGORY_PATHS = [
  '/category/fruits--vegetables',
  '/category/bakery',
  '/category/meat',
  '/category/poultry',
  '/category/seafood',
  '/category/dairy',
  '/category/food--beverages',
  '/category/water--beverages',
  '/category/baking',
  '/category/rice--pasta',
  '/category/canned-food',
];
const TAMIMI_CATEGORY_EXCLUDE_PATTERNS = [/\/category\/hot-deals$/i];

const SUPPORTED_SOURCES = {
  tamimi: {
    key: 'tamimi',
    label: 'Tamimi Markets',
    baseUrl: TAMIMI_BASE_URL,
    categorySitemapUrl: TAMIMI_CATEGORY_SITEMAP_URL,
    defaultCategoryUrls: TAMIMI_DEFAULT_CATEGORY_PATHS.map((path) => new URL(path, TAMIMI_BASE_URL).toString()),
  },
};

const MARKET_IMPORT_CATEGORY_CACHE_TTL_MS = 15 * 60 * 1000;
const IMPORTED_PRODUCTS_RESPONSE_LIMIT = 25;
const marketImportCategoryCache = new Map();

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number.parseInt(code, 10)));
}

function stripTags(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ');
}

function normalizeWhitespace(value) {
  return decodeHtmlEntities(stripTags(value)).replace(/\s+/g, ' ').trim();
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function toAbsoluteUrl(value, baseUrl = TAMIMI_BASE_URL) {
  try {
    return new URL(value, baseUrl).toString();
  } catch (_error) {
    return '';
  }
}

function parseXmlLocs(xml) {
  return Array.from(String(xml || '').matchAll(/<loc>(.*?)<\/loc>/gsi))
    .map((match) => decodeHtmlEntities(match[1]).trim())
    .filter(Boolean);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Buysial ERP Market Import/0.1',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`Market source request failed with status ${response.status} for ${url}`);
  }

  return response.text();
}

function extractMetaContent(html, key) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = String(html || '').match(pattern);
    if (match?.[1]) {
      return normalizeWhitespace(match[1]);
    }
  }

  return '';
}

function parseStructuredPrice(html) {
  const candidates = [
    extractMetaContent(html, 'product:price:amount'),
    extractMetaContent(html, 'og:price:amount'),
    ...Array.from(String(html || '').matchAll(/"price"\s*:\s*"?(\d+(?:\.\d{1,2})?)"?/gi)).map((match) => match[1]),
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return null;
}

function parseStructuredImage(html, baseUrl = TAMIMI_BASE_URL) {
  const directCandidates = [extractMetaContent(html, 'og:image'), extractMetaContent(html, 'twitter:image')];

  for (const candidate of directCandidates) {
    const resolved = toAbsoluteUrl(candidate, baseUrl);
    if (resolved) {
      return resolved;
    }
  }

  const imageMatch = String(html || '').match(/"image"\s*:\s*"([^"]+)"/i);
  return toAbsoluteUrl(imageMatch?.[1] || '', baseUrl);
}

function extractTitleFromHtml(html) {
  const titleMatch = String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return normalizeWhitespace(titleMatch?.[1] || '').replace(/\s*\|\s*Tamimi Markets$/i, '').trim();
}

function extractBrandFromHtml(html) {
  const brandMatch = String(html || '').match(/<a[^>]+href=["'](?:https?:\/\/shop\.tamimimarkets\.com)?\/brand\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/i);
  return normalizeWhitespace(brandMatch?.[1] || '');
}

function parseUnitFromSize(sizeText, categorySlug) {
  const normalized = String(sizeText || '').toLowerCase();
  const category = String(categorySlug || '').toLowerCase();

  if (/\b(kg|g|gm|gram|grams)\b/.test(normalized) || /(fruits|vegetables|meat|poultry|seafood)/.test(category)) {
    return PRODUCT_UNITS.KG;
  }

  if (/\b(ml|l|ltr|lt|liter|litre)\b/.test(normalized)) {
    return PRODUCT_UNITS.LITER;
  }

  return PRODUCT_UNITS.EACH;
}

function parseNameAndSize(label) {
  const normalized = normalizeWhitespace(label);
  const withoutPackPrices = normalized.replace(/\s+\d+(?:\.\d{1,2})?\s*\/.*$/i, '').trim();
  const nameSizeMatch = withoutPackPrices.match(/^(.*?)-\s*([\d.,xX+\s]+(?:kg|g|gm|ml|l|ltr|lt|oz|pcs|pc|count|counts|ct|pack|packs)\b.*)$/i);

  if (nameSizeMatch) {
    return {
      displayName: nameSizeMatch[1].trim(),
      sizeText: nameSizeMatch[2].trim(),
    };
  }

  return {
    displayName: withoutPackPrices,
    sizeText: '',
  };
}

function parseTamimiCategoryProductLabel(label) {
  const normalized = normalizeWhitespace(label).replace(/^\d+%\s*OFF\s*/i, '').trim();
  const priceMatch = normalized.match(/^(\d+(?:\.\d{1,2})?)/);

  if (!priceMatch) {
    return null;
  }

  const sellingPrice = Number(priceMatch[1]);
  const remainder = normalized.slice(priceMatch[0].length).trim();
  const { displayName, sizeText } = parseNameAndSize(remainder);

  if (!displayName) {
    return null;
  }

  return {
    displayName,
    sizeText,
    sellingPrice,
  };
}

function extractCategoryNameFromUrl(categoryUrl) {
  const pathname = new URL(categoryUrl).pathname;
  const rawSlug = pathname.split('/category/')[1] || 'general';
  const displayName = rawSlug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  return {
    slug: slugify(rawSlug),
    name: displayName,
  };
}

function parseTamimiCategoryProducts(html, categoryUrl) {
  const products = new Map();
  const { slug: categorySlug, name: categoryName } = extractCategoryNameFromUrl(categoryUrl);

  for (const match of String(html || '').matchAll(/<a[^>]+href=["']([^"']*\/product\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const sourceUrl = toAbsoluteUrl(match[1], TAMIMI_BASE_URL);
    const parsed = parseTamimiCategoryProductLabel(match[2]);

    if (!sourceUrl || !parsed?.displayName) {
      continue;
    }

    const productSlug = slugify(new URL(sourceUrl).pathname.split('/product/')[1] || parsed.displayName);
    if (!productSlug || products.has(productSlug)) {
      continue;
    }

    products.set(productSlug, {
      slug: productSlug,
      sourceMarketplace: 'tamimi',
      sourceUrl,
      category: {
        en: categoryName,
        ar: categoryName,
      },
      categorySlug,
      name: {
        en: parsed.displayName,
        ar: parsed.displayName,
      },
      brand: {
        en: '',
        ar: '',
      },
      sellingPrice: parsed.sellingPrice,
      costPrice: 0,
      vatRate: 15,
      sizeText: parsed.sizeText,
      unit: parseUnitFromSize(parsed.sizeText, categorySlug),
      barcode: '',
      imageUrl: '',
      stockQuantity: 0,
      reorderLevel: 0,
      requiresExpiryTracking: false,
      isWeighedItem: false,
    });
  }

  return Array.from(products.values());
}

async function enrichTamimiProduct(product) {
  try {
    const html = await fetchText(product.sourceUrl);
    return {
      ...product,
      name: {
        en: extractTitleFromHtml(html) || product.name.en,
        ar: extractTitleFromHtml(html) || product.name.ar,
      },
      brand: {
        en: extractBrandFromHtml(html) || product.brand.en || 'Tamimi Markets',
        ar: extractBrandFromHtml(html) || product.brand.ar || 'Tamimi Markets',
      },
      sellingPrice: parseStructuredPrice(html) || product.sellingPrice,
      imageUrl: parseStructuredImage(html, TAMIMI_BASE_URL) || product.imageUrl,
    };
  } catch (_error) {
    return {
      ...product,
      brand: {
        en: product.brand.en || 'Tamimi Markets',
        ar: product.brand.ar || 'Tamimi Markets',
      },
    };
  }
}

export function getSupportedMarketImportSources() {
  return Object.values(SUPPORTED_SOURCES).map((source) => ({
    key: source.key,
    label: source.label,
    baseUrl: source.baseUrl,
    categorySitemapUrl: source.categorySitemapUrl,
    defaultCategoryUrls: source.defaultCategoryUrls,
    defaultCategoryResolution: source.categorySitemapUrl ? 'sitemap' : 'static',
  }));
}

export async function discoverTamimiCategoryUrls() {
  const xml = await fetchText(TAMIMI_CATEGORY_SITEMAP_URL);
  return parseXmlLocs(xml);
}

function filterTamimiCategoryUrls(categoryUrls) {
  return Array.from(new Map(categoryUrls.map((url) => [String(url || '').trim(), String(url || '').trim()])).values()).filter((url) => {
    if (!url) {
      return false;
    }

    return !TAMIMI_CATEGORY_EXCLUDE_PATTERNS.some((pattern) => pattern.test(url));
  });
}

export async function discoverMarketImportCategoryUrls(sourceKey = 'tamimi') {
  const source = SUPPORTED_SOURCES[sourceKey];

  if (!source) {
    throw new Error('Unsupported market import source.');
  }

  const cacheKey = source.key;
  const cachedEntry = marketImportCategoryCache.get(cacheKey);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return cachedEntry.categoryUrls;
  }

  let categoryUrls = source.defaultCategoryUrls;

  if (source.key === 'tamimi') {
    categoryUrls = filterTamimiCategoryUrls(await discoverTamimiCategoryUrls());
  }

  marketImportCategoryCache.set(cacheKey, {
    categoryUrls,
    expiresAt: Date.now() + MARKET_IMPORT_CATEGORY_CACHE_TTL_MS,
  });

  return categoryUrls;
}

async function resolveRequestedCategoryUrls(source, categoryUrls) {
  const requested = Array.isArray(categoryUrls) ? categoryUrls.map((value) => String(value || '').trim()).filter(Boolean) : [];

  if (requested.length > 0) {
    return source.key === 'tamimi' ? filterTamimiCategoryUrls(requested) : requested;
  }

  if (source.categorySitemapUrl) {
    return discoverMarketImportCategoryUrls(source.key);
  }

  return source.defaultCategoryUrls;
}

function clampMaxProducts(value, fallback = 250) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, 2000);
}

function clampDetailEnrichmentLimit(value, fallback = 60) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(parsed, 250);
}

async function mapWithConcurrencyLimit(items, limit, mapper) {
  const normalizedItems = Array.isArray(items) ? items : [];
  const concurrency = Math.max(1, Number(limit) || 1);
  const results = new Array(normalizedItems.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < normalizedItems.length) {
      const targetIndex = currentIndex;
      currentIndex += 1;
      results[targetIndex] = await mapper(normalizedItems[targetIndex], targetIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, normalizedItems.length || 1) }, () => worker()));
  return results;
}

export async function previewMarketImport({ sourceKey = 'tamimi', categoryUrls = [], maxProducts = 250, enrichProducts = true, detailEnrichmentLimit = 60 }) {
  const source = SUPPORTED_SOURCES[sourceKey];

  if (!source) {
    throw new Error('Unsupported market import source.');
  }

  const resolvedCategoryUrls = await resolveRequestedCategoryUrls(source, categoryUrls);
  const limitedMaxProducts = clampMaxProducts(maxProducts);
  const limitedDetailEnrichment = enrichProducts ? clampDetailEnrichmentLimit(detailEnrichmentLimit, Math.min(60, limitedMaxProducts)) : 0;
  const scannedCategoryUrls = resolvedCategoryUrls.slice(0, Math.max(1, limitedMaxProducts));
  const categoryResults = await mapWithConcurrencyLimit(scannedCategoryUrls, 4, async (categoryUrl) => {
    try {
      const html = await fetchText(categoryUrl);
      return {
        ok: true,
        categoryUrl,
        items: parseTamimiCategoryProducts(html, categoryUrl),
      };
    } catch (error) {
      return {
        ok: false,
        categoryUrl,
        message: error.message || 'Unable to fetch category page.',
        items: [],
      };
    }
  });

  const failedCategoryUrls = categoryResults
    .filter((result) => !result.ok)
    .map((result) => ({
      url: result.categoryUrl,
      message: result.message,
    }));
  const discovered = [];

  for (const result of categoryResults) {
    for (const item of result.items) {
      if (discovered.length >= limitedMaxProducts) {
        break;
      }

      discovered.push(item);
    }

    if (discovered.length >= limitedMaxProducts) {
      break;
    }
  }

  const uniqueItems = Array.from(new Map(discovered.map((item) => [item.slug, item])).values()).slice(0, limitedMaxProducts);
  const baseItems = [...uniqueItems];
  const items = [...baseItems];
  let enrichedCount = 0;

  if (limitedDetailEnrichment > 0) {
    const enrichedItems = await mapWithConcurrencyLimit(baseItems.slice(0, limitedDetailEnrichment), 6, async (item) => enrichTamimiProduct(item));
    for (const [index, item] of enrichedItems.entries()) {
      items[index] = item;
      enrichedCount += 1;
    }
  }

  return {
    source: source.key,
    sourceLabel: source.label,
    categoryUrls: resolvedCategoryUrls,
    categoriesScanned: scannedCategoryUrls.length,
    failedCategoryCount: failedCategoryUrls.length,
    failedCategoryUrls,
    enrichedCount,
    totalDiscovered: items.length,
    items,
  };
}

async function ensureTenantCategory({ tenantId, categorySlug, categoryName }) {
  return Category.findOneAndUpdate(
    { tenantId, slug: categorySlug },
    {
      $setOnInsert: {
        tenantId,
        slug: categorySlug,
        name: {
          en: categoryName,
          ar: categoryName,
        },
        isActive: true,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}

function buildImportedSku(sourceMarketplace, slug) {
  return `${String(sourceMarketplace || 'market').toUpperCase()}-${String(slug || 'item').toUpperCase().slice(0, 56)}`;
}

function buildImportedProductPayload({ tenantId, categoryId, item, defaultVatRate = 15 }) {
  return {
    tenantId,
    categoryId,
    supplierId: null,
    name: item.name,
    brand: item.brand,
    sku: buildImportedSku(item.sourceMarketplace, item.slug),
    barcode: String(item.barcode || '').trim() || undefined,
    imageUrl: String(item.imageUrl || '').trim(),
    sourceMarketplace: String(item.sourceMarketplace || '').trim(),
    sourceUrl: String(item.sourceUrl || '').trim(),
    costPrice: Number(item.costPrice || 0),
    sellingPrice: Number(item.sellingPrice || 0),
    vatRate: Number(item.vatRate ?? defaultVatRate),
    unit: item.unit || PRODUCT_UNITS.EACH,
    isWeighedItem: false,
    scaleBarcodePrefix: '20',
    scaleItemCode: '',
    packedDate: null,
    expiryDate: null,
    requiresExpiryTracking: Boolean(item.requiresExpiryTracking),
    stockQuantity: Number(item.stockQuantity || 0),
    reorderLevel: Number(item.reorderLevel || 0),
    isActive: true,
  };
}

export async function syncMarketImportToCatalog({
  tenantId,
  sourceKey = 'tamimi',
  categoryUrls = [],
  maxProducts = 250,
  enrichProducts = true,
  detailEnrichmentLimit = 60,
  defaultVatRate = 15,
  allowUpdate = true,
}) {
  const preview = await previewMarketImport({ sourceKey, categoryUrls, maxProducts, enrichProducts, detailEnrichmentLimit });
  const summary = {
    source: preview.source,
    sourceLabel: preview.sourceLabel,
    discovered: preview.items.length,
    categoriesScanned: preview.categoriesScanned,
    failedCategoryCount: preview.failedCategoryCount,
    enrichedCount: preview.enrichedCount,
    created: 0,
    updated: 0,
    skipped: 0,
    importedProductsLimit: IMPORTED_PRODUCTS_RESPONSE_LIMIT,
    importedProductsTruncated: false,
    importedProducts: [],
  };

  for (const item of preview.items) {
    const category = await ensureTenantCategory({
      tenantId,
      categorySlug: item.categorySlug || 'imported-market-products',
      categoryName: item.category?.en || 'Imported Market Products',
    });

    const payload = buildImportedProductPayload({
      tenantId,
      categoryId: category._id,
      item,
      defaultVatRate,
    });

    const existingProduct = await Product.findOne({ tenantId, sku: payload.sku }).lean();

    if (existingProduct && !allowUpdate) {
      summary.skipped += 1;
      continue;
    }

    const savedProduct = await Product.findOneAndUpdate(
      { tenantId, sku: payload.sku },
      {
        $set: payload,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    )
      .populate('categoryId')
      .lean();

    if (existingProduct) {
      summary.updated += 1;
    } else {
      summary.created += 1;
    }

    if (summary.importedProducts.length < IMPORTED_PRODUCTS_RESPONSE_LIMIT) {
      summary.importedProducts.push(savedProduct);
    } else {
      summary.importedProductsTruncated = true;
    }
  }

  return summary;
}

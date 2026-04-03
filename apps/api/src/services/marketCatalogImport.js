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

const SUPPORTED_SOURCES = {
  tamimi: {
    key: 'tamimi',
    label: 'Tamimi Markets',
    baseUrl: TAMIMI_BASE_URL,
    categorySitemapUrl: TAMIMI_CATEGORY_SITEMAP_URL,
    defaultCategoryUrls: TAMIMI_DEFAULT_CATEGORY_PATHS.map((path) => new URL(path, TAMIMI_BASE_URL).toString()),
  },
};

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
  }));
}

export async function discoverTamimiCategoryUrls() {
  const xml = await fetchText(TAMIMI_CATEGORY_SITEMAP_URL);
  return parseXmlLocs(xml);
}

function resolveRequestedCategoryUrls(source, categoryUrls) {
  const requested = Array.isArray(categoryUrls) ? categoryUrls.map((value) => String(value || '').trim()).filter(Boolean) : [];
  return requested.length > 0 ? requested : source.defaultCategoryUrls;
}

function clampMaxProducts(value, fallback = 120) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, 500);
}

export async function previewMarketImport({ sourceKey = 'tamimi', categoryUrls = [], maxProducts = 120, enrichProducts = true }) {
  const source = SUPPORTED_SOURCES[sourceKey];

  if (!source) {
    throw new Error('Unsupported market import source.');
  }

  const resolvedCategoryUrls = resolveRequestedCategoryUrls(source, categoryUrls);
  const limitedMaxProducts = clampMaxProducts(maxProducts);
  const discovered = [];

  for (const categoryUrl of resolvedCategoryUrls) {
    if (discovered.length >= limitedMaxProducts) {
      break;
    }

    const html = await fetchText(categoryUrl);
    const categoryItems = parseTamimiCategoryProducts(html, categoryUrl);

    for (const item of categoryItems) {
      if (discovered.length >= limitedMaxProducts) {
        break;
      }

      discovered.push(item);
    }
  }

  const uniqueItems = Array.from(new Map(discovered.map((item) => [item.slug, item])).values()).slice(0, limitedMaxProducts);
  const items = [];

  for (const item of uniqueItems) {
    items.push(enrichProducts ? await enrichTamimiProduct(item) : item);
  }

  return {
    source: source.key,
    sourceLabel: source.label,
    categoryUrls: resolvedCategoryUrls,
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
  maxProducts = 120,
  enrichProducts = true,
  defaultVatRate = 15,
  allowUpdate = true,
}) {
  const preview = await previewMarketImport({ sourceKey, categoryUrls, maxProducts, enrichProducts });
  const summary = {
    source: preview.source,
    sourceLabel: preview.sourceLabel,
    discovered: preview.items.length,
    created: 0,
    updated: 0,
    skipped: 0,
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

    summary.importedProducts.push(savedProduct);
  }

  return summary;
}

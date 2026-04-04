import { PRODUCT_UNITS, normalizeBarcode } from '@vitalblaze/shared';

const OPEN_FOOD_FACTS_FIELDS = [
  'code',
  'product_name',
  'product_name_ar',
  'brands',
  'image_front_url',
  'image_url',
  'quantity',
  'categories',
  'categories_tags',
  'countries',
  'countries_tags',
];

const OPEN_FOOD_FACTS_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'BuysialERP/0.1 (support@buysialerp.sa)',
};

const SAUDI_SEED_PRODUCTS = [
  {
    barcode: '6281007023115',
    brand: { en: 'Almarai', ar: 'المراعي' },
    name: { en: 'Fresh Milk 2.85L', ar: 'حليب طازج 2.85 لتر' },
    category: { en: 'Dairy', ar: 'ألبان' },
    unit: PRODUCT_UNITS.LITER,
    vatRate: 15,
    exciseTaxRate: 0,
    taxCategory: 'STANDARD',
    requiresExpiryTracking: true,
    storageTemperature: '2C to 5C',
    referencePrice: 11,
    catalogSource: 'saudi_seed',
  },
  {
    barcode: '6281007051347',
    brand: { en: 'Almarai', ar: 'المراعي' },
    name: { en: 'Cheese Jar 500g', ar: 'جبنة برطمان 500 جم' },
    category: { en: 'Dairy', ar: 'ألبان' },
    unit: PRODUCT_UNITS.GRAM,
    vatRate: 15,
    exciseTaxRate: 0,
    taxCategory: 'STANDARD',
    requiresExpiryTracking: true,
    storageTemperature: '2C to 5C',
    referencePrice: 18.5,
    catalogSource: 'saudi_seed',
  },
  {
    barcode: '6281007005470',
    brand: { en: 'Lusine', ar: 'لوسين' },
    name: { en: 'Sliced Bread 600g', ar: 'خبز شرائح 600 جم' },
    category: { en: 'Bakery', ar: 'مخبوزات' },
    unit: PRODUCT_UNITS.GRAM,
    vatRate: 15,
    exciseTaxRate: 0,
    taxCategory: 'STANDARD',
    requiresExpiryTracking: true,
    storageTemperature: 'Ambient',
    referencePrice: 5.5,
    catalogSource: 'saudi_seed',
  },
  {
    barcode: '6281014020046',
    brand: { en: 'Abu Kass', ar: 'أبو كاس' },
    name: { en: 'Basmati Rice 10kg', ar: 'أرز بسمتي 10 كجم' },
    category: { en: 'Pantry', ar: 'مؤن غذائية' },
    unit: PRODUCT_UNITS.KG,
    vatRate: 15,
    exciseTaxRate: 0,
    taxCategory: 'STANDARD',
    requiresExpiryTracking: false,
    storageTemperature: 'Ambient',
    referencePrice: 89,
    catalogSource: 'saudi_seed',
  },
  {
    barcode: '6281017101117',
    brand: { en: 'Afia', ar: 'عافية' },
    name: { en: 'Corn Oil 1.5L', ar: 'زيت ذرة 1.5 لتر' },
    category: { en: 'Pantry', ar: 'مؤن غذائية' },
    unit: PRODUCT_UNITS.LITER,
    vatRate: 15,
    exciseTaxRate: 0,
    taxCategory: 'STANDARD',
    requiresExpiryTracking: false,
    storageTemperature: 'Ambient',
    referencePrice: 19.95,
    catalogSource: 'saudi_seed',
  },
  {
    barcode: '6281057011018',
    brand: { en: 'Indomie', ar: 'إندومي' },
    name: { en: 'Chicken Flavor 5 Pack', ar: 'نكهة دجاج 5 عبوات' },
    category: { en: 'Pantry', ar: 'مؤن غذائية' },
    unit: PRODUCT_UNITS.BOX,
    vatRate: 15,
    exciseTaxRate: 0,
    taxCategory: 'STANDARD',
    requiresExpiryTracking: false,
    storageTemperature: 'Ambient',
    referencePrice: 7.5,
    catalogSource: 'saudi_seed',
  },
  {
    barcode: '6281006001015',
    brand: { en: 'Pepsi', ar: 'بيبسي' },
    name: { en: 'Can 320ml', ar: 'علبة 320 مل' },
    category: { en: 'Beverages', ar: 'مشروبات' },
    unit: PRODUCT_UNITS.LITER,
    vatRate: 15,
    exciseTaxRate: 50,
    taxCategory: 'SOFT_DRINK',
    requiresExpiryTracking: false,
    storageTemperature: 'Ambient',
    referencePrice: 3,
    catalogSource: 'saudi_seed',
  },
  {
    barcode: '9002490100070',
    brand: { en: 'Red Bull', ar: 'ريد بول' },
    name: { en: 'Energy Drink 250ml', ar: 'مشروب طاقة 250 مل' },
    category: { en: 'Energy Drinks', ar: 'مشروبات طاقة' },
    unit: PRODUCT_UNITS.LITER,
    vatRate: 15,
    exciseTaxRate: 100,
    taxCategory: 'ENERGY_DRINK',
    requiresExpiryTracking: false,
    storageTemperature: 'Ambient',
    referencePrice: 12.5,
    catalogSource: 'saudi_seed',
  },
];

const SAUDI_SEED_BY_BARCODE = new Map(SAUDI_SEED_PRODUCTS.map((product) => [product.barcode, product]));

function trimString(value) {
  return String(value || '').trim();
}

function createLocalizedValue(value, fallback = '') {
  const normalized = trimString(value);
  const fallbackValue = trimString(fallback);
  const resolved = normalized || fallbackValue;

  if (!resolved) {
    return null;
  }

  return {
    en: normalized || fallbackValue,
    ar: fallbackValue || normalized,
  };
}

function mergeLocalizedValue(primary, secondary = null) {
  if (!primary && !secondary) {
    return null;
  }

  const primaryEn = trimString(primary?.en);
  const primaryAr = trimString(primary?.ar);
  const secondaryEn = trimString(secondary?.en);
  const secondaryAr = trimString(secondary?.ar);
  const fallbackEn = primaryEn || secondaryEn || secondaryAr;
  const fallbackAr = primaryAr || secondaryAr || fallbackEn;

  if (!fallbackEn && !fallbackAr) {
    return null;
  }

  return {
    en: fallbackEn,
    ar: fallbackAr,
  };
}

function inferCategory(text) {
  const normalized = trimString(text).toLowerCase();

  const categoryMatchers = [
    { pattern: /(milk|laban|labneh|yogurt|yoghurt|cheese|بيض|حليب|لبن|لبنة|زبادي|جبنة)/i, value: { en: 'Dairy', ar: 'ألبان' } },
    { pattern: /(bread|toast|bun|croissant|خبز|توست|مخبوز)/i, value: { en: 'Bakery', ar: 'مخبوزات' } },
    { pattern: /(cola|pepsi|soda|carbonated|sparkling|soft drink|بيبسي|غازي|كولا)/i, value: { en: 'Beverages', ar: 'مشروبات' } },
    { pattern: /(energy drink|red bull|monster|power horse|طاقة|ريد بول)/i, value: { en: 'Energy Drinks', ar: 'مشروبات طاقة' } },
    { pattern: /(rice|oil|noodles|pasta|tuna|tea|coffee|sugar|flour|أرز|زيت|شعيرية|مكرونة|تونة|شاي|قهوة|سكر|طحين)/i, value: { en: 'Pantry', ar: 'مؤن غذائية' } },
    { pattern: /(chips|chocolate|biscuits|cookies|dates|snack|شيبس|شوكولاتة|بسكويت|تمر)/i, value: { en: 'Snacks', ar: 'وجبات خفيفة' } },
    { pattern: /(detergent|tissue|soap|shampoo|sanitizer|cleaner|منظف|مناديل|صابون|شامبو|مطهر)/i, value: { en: 'Household', ar: 'منظفات وعناية' } },
    { pattern: /(banana|tomato|potato|apple|orange|onion|produce|موز|طماطم|بطاطس|تفاح|برتقال|بصل)/i, value: { en: 'Produce', ar: 'خضار وفواكه' } },
    { pattern: /(chicken|beef|lamb|meat|fish|poultry|دجاج|لحم|سمك|لحوم)/i, value: { en: 'Protein', ar: 'لحوم ودواجن' } },
    { pattern: /(water|مياه|ماء)/i, value: { en: 'Water', ar: 'مياه' } },
  ];

  const match = categoryMatchers.find((entry) => entry.pattern.test(normalized));
  return match?.value || { en: 'General Merchandise', ar: 'سلع عامة' };
}

function inferUnitFromText(text) {
  const normalized = trimString(text).toLowerCase();

  if (/(\d+(?:\.\d+)?)\s*(kg|كيلو|كجم)/i.test(normalized)) {
    return PRODUCT_UNITS.KG;
  }

  if (/(\d+(?:\.\d+)?)\s*(g|gm|gram|جرام|جم)/i.test(normalized)) {
    return PRODUCT_UNITS.GRAM;
  }

  if (/(\d+(?:\.\d+)?)\s*(l|ltr|liter|litre|ml|مل|لتر)/i.test(normalized)) {
    return PRODUCT_UNITS.LITER;
  }

  if (/(pack|box|bags|pcs|pieces|عبوة|علبة|حبة|كيس)/i.test(normalized)) {
    return PRODUCT_UNITS.BOX;
  }

  return PRODUCT_UNITS.EACH;
}

function inferRequiresExpiryTracking(text, category) {
  const normalized = trimString(text).toLowerCase();
  const categoryName = trimString(category?.en).toLowerCase();
  return /(milk|laban|labneh|yogurt|yoghurt|cheese|bread|bakery|juice|chicken|meat|produce|egg|حليب|لبن|لبنة|زبادي|جبنة|خبز|عصير|دجاج|لحم|بيض|خضار|فاكهة)/i.test(normalized) || ['dairy', 'bakery', 'produce', 'protein'].includes(categoryName);
}

function inferTaxProfile(text) {
  const normalized = trimString(text).toLowerCase();

  if (/(energy drink|red bull|monster|power horse|طاقة|ريد بول)/i.test(normalized)) {
    return {
      vatRate: 15,
      exciseTaxRate: 100,
      taxCategory: 'ENERGY_DRINK',
      requiresTaxReview: false,
    };
  }

  if (/(cola|pepsi|coca|soft drink|carbonated|soda|بيبسي|كوكا|غازي|كولا)/i.test(normalized)) {
    return {
      vatRate: 15,
      exciseTaxRate: 50,
      taxCategory: 'SOFT_DRINK',
      requiresTaxReview: false,
    };
  }

  if (/(juice|nectar|mango drink|orange drink|عصير|شراب)/i.test(normalized)) {
    return {
      vatRate: 15,
      exciseTaxRate: 50,
      taxCategory: 'SWEETENED_BEVERAGE',
      requiresTaxReview: true,
    };
  }

  return {
    vatRate: 15,
    exciseTaxRate: 0,
    taxCategory: 'STANDARD',
    requiresTaxReview: false,
  };
}

function buildRetailSearchUrls(barcode) {
  return {
    carrefourKsa: `https://www.carrefourksa.com/mafsau/en/search?text=${barcode}`,
    othaim: `https://www.othaimmarkets.com/catalogsearch/result/?q=${barcode}`,
    luluSaudi: `https://www.luluhypermarket.com/en-sa/search/?text=${barcode}`,
  };
}

function buildLookupNotes(product) {
  const notes = [
    'Store product master locally and treat external lookups as enrichment only.',
    'Use FEFO for expiry-tracked products and batch receiving through GRN lines.',
    'Keep selling price and cost price tenant-specific even when barcode metadata is shared.',
  ];

  if (product.requiresTaxReview) {
    notes.push('Review excise classification manually for sweetened beverages against the current ZATCA rules.');
  }

  if (!product.referencePrice) {
    notes.push('No trusted free Saudi price feed was found for this barcode, so price should be confirmed manually or through a licensed retailer feed.');
  }

  return notes;
}

async function fetchJson(url) {
  if (typeof fetch !== 'function') {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(url, {
      headers: OPEN_FOOD_FACTS_HEADERS,
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function lookupOpenFoodFactsProduct(barcode) {
  const fields = encodeURIComponent(OPEN_FOOD_FACTS_FIELDS.join(','));
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${fields}`;
  const payload = await fetchJson(url);
  const product = payload?.product;

  if (!product) {
    return null;
  }

  const combinedText = [
    product.product_name,
    product.product_name_ar,
    product.brands,
    product.categories,
    product.quantity,
  ]
    .filter(Boolean)
    .join(' ');
  const category = inferCategory(`${product.categories || ''} ${product.product_name || ''}`);
  const taxProfile = inferTaxProfile(combinedText);

  return {
    barcode,
    brand: createLocalizedValue(product.brands),
    name: createLocalizedValue(product.product_name, product.product_name_ar),
    category,
    unit: inferUnitFromText(`${product.quantity || ''} ${product.product_name || ''}`),
    vatRate: taxProfile.vatRate,
    exciseTaxRate: taxProfile.exciseTaxRate,
    taxCategory: taxProfile.taxCategory,
    requiresTaxReview: taxProfile.requiresTaxReview,
    requiresExpiryTracking: inferRequiresExpiryTracking(combinedText, category),
    imageUrl: trimString(product.image_front_url || product.image_url),
    countryOfOrigin: trimString(product.countries),
    storageTemperature: '',
    referencePrice: null,
    catalogSource: 'open_food_facts',
  };
}

function mergeCatalogProducts(seedProduct, openFoodFactsProduct, barcode) {
  const mergedBase = seedProduct || openFoodFactsProduct;

  if (!mergedBase) {
    return null;
  }

  const combinedText = [
    seedProduct?.name?.en,
    seedProduct?.name?.ar,
    seedProduct?.brand?.en,
    openFoodFactsProduct?.name?.en,
    openFoodFactsProduct?.name?.ar,
    openFoodFactsProduct?.brand?.en,
    openFoodFactsProduct?.category?.en,
  ]
    .filter(Boolean)
    .join(' ');
  const category = seedProduct?.category || openFoodFactsProduct?.category || inferCategory(combinedText);
  const taxProfile = seedProduct
    ? {
        vatRate: Number(seedProduct.vatRate || 15),
        exciseTaxRate: Number(seedProduct.exciseTaxRate || 0),
        taxCategory: trimString(seedProduct.taxCategory) || 'STANDARD',
        requiresTaxReview: false,
      }
    : inferTaxProfile(combinedText);

  return {
    barcode,
    brand: mergeLocalizedValue(seedProduct?.brand, openFoodFactsProduct?.brand),
    name: mergeLocalizedValue(seedProduct?.name, openFoodFactsProduct?.name),
    category,
    unit: seedProduct?.unit || openFoodFactsProduct?.unit || inferUnitFromText(combinedText),
    vatRate: taxProfile.vatRate,
    exciseTaxRate: taxProfile.exciseTaxRate,
    taxCategory: taxProfile.taxCategory,
    requiresTaxReview: taxProfile.requiresTaxReview || Boolean(openFoodFactsProduct?.requiresTaxReview),
    requiresExpiryTracking:
      typeof seedProduct?.requiresExpiryTracking === 'boolean'
        ? seedProduct.requiresExpiryTracking
        : typeof openFoodFactsProduct?.requiresExpiryTracking === 'boolean'
          ? openFoodFactsProduct.requiresExpiryTracking
          : inferRequiresExpiryTracking(combinedText, category),
    imageUrl: trimString(seedProduct?.imageUrl || openFoodFactsProduct?.imageUrl),
    countryOfOrigin: trimString(seedProduct?.countryOfOrigin || openFoodFactsProduct?.countryOfOrigin),
    storageTemperature: trimString(seedProduct?.storageTemperature || openFoodFactsProduct?.storageTemperature),
    referencePrice: Number(seedProduct?.referencePrice || 0) || null,
    catalogSource: [seedProduct?.catalogSource, openFoodFactsProduct?.catalogSource].filter(Boolean).join('+') || 'manual',
  };
}

export async function lookupSaudiBarcodeCatalog(rawBarcode) {
  const barcode = normalizeBarcode(rawBarcode);

  if (!/^\d{8,14}$/.test(barcode)) {
    throw new Error('Barcode must be 8 to 14 numeric digits.');
  }

  const seedProduct = SAUDI_SEED_BY_BARCODE.get(barcode) || null;
  const openFoodFactsProduct = await lookupOpenFoodFactsProduct(barcode);
  const mergedProduct = mergeCatalogProducts(seedProduct, openFoodFactsProduct, barcode);
  const fallbackCategory = { en: 'General Merchandise', ar: 'سلع عامة' };
  const fallbackProduct = mergedProduct || {
    barcode,
    brand: null,
    name: null,
    category: fallbackCategory,
    unit: PRODUCT_UNITS.EACH,
    vatRate: 15,
    exciseTaxRate: 0,
    taxCategory: 'STANDARD',
    requiresTaxReview: false,
    requiresExpiryTracking: false,
    imageUrl: '',
    countryOfOrigin: '',
    storageTemperature: '',
    referencePrice: null,
    catalogSource: 'unresolved',
  };

  return {
    barcode,
    found: Boolean(mergedProduct),
    availableSources: [seedProduct ? 'saudi_seed' : null, openFoodFactsProduct ? 'open_food_facts' : null].filter(Boolean),
    draft: {
      ...fallbackProduct,
      inventoryMethod: fallbackProduct.requiresExpiryTracking ? 'FEFO' : 'FIFO',
    },
    searchUrls: buildRetailSearchUrls(barcode),
    notes: buildLookupNotes(fallbackProduct),
  };
}

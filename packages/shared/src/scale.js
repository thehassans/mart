import { SCALE_BARCODE_PREFIXES } from './domain.js';

export function normalizeBarcode(rawBarcode) {
  return String(rawBarcode || '').replace(/\s+/g, '').trim();
}

export function isScaleBarcode(rawBarcode, prefixes = SCALE_BARCODE_PREFIXES) {
  const barcode = normalizeBarcode(rawBarcode);
  return /^\d{13}$/.test(barcode) && prefixes.includes(barcode.slice(0, 2));
}

export function parseScaleBarcode(rawBarcode, options = {}) {
  const {
    itemCodeLength = 5,
    valueLength = 5,
    quantityPrefixes = ['20', '21'],
    pricePrefixes = ['22', '23'],
    weightDivisor = 1000,
    priceDivisor = 100,
  } = options;

  const barcode = normalizeBarcode(rawBarcode);

  if (!isScaleBarcode(barcode, [...quantityPrefixes, ...pricePrefixes])) {
    return null;
  }

  const prefix = barcode.slice(0, 2);
  const itemCode = barcode.slice(2, 2 + itemCodeLength);
  const rawValue = barcode.slice(2 + itemCodeLength, 2 + itemCodeLength + valueLength);
  const checkDigit = barcode.slice(-1);
  const numericValue = Number(rawValue);
  const isPriceMode = pricePrefixes.includes(prefix);
  const isQuantityMode = quantityPrefixes.includes(prefix);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return {
    rawBarcode: barcode,
    prefix,
    itemCode,
    rawValue,
    checkDigit,
    mode: isPriceMode ? 'price' : isQuantityMode ? 'quantity' : 'unknown',
    embeddedValue: numericValue,
    quantity: isQuantityMode ? numericValue / weightDivisor : null,
    price: isPriceMode ? numericValue / priceDivisor : null,
  };
}

export function resolveScaleBarcodeProduct(rawBarcode, products = [], options = {}) {
  const parsed = parseScaleBarcode(rawBarcode, options);

  if (!parsed) {
    return null;
  }

  const product = products.find((candidate) => String(candidate.scaleItemCode || '').trim() === parsed.itemCode);

  if (!product) {
    return {
      parsed,
      product: null,
      quantity: parsed.quantity,
      totalPrice: parsed.price,
      unitPrice: null,
    };
  }

  const unitPrice = Number(product.sellingPrice || 0);
  const quantity = parsed.mode === 'quantity'
    ? parsed.quantity
    : unitPrice > 0
      ? Number((parsed.price / unitPrice).toFixed(3))
      : 0;
  const totalPrice = parsed.mode === 'price'
    ? parsed.price
    : Number((quantity * unitPrice).toFixed(2));

  return {
    parsed,
    product,
    quantity,
    totalPrice,
    unitPrice,
  };
}

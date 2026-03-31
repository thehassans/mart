import { resolveScaleBarcodeProduct } from '@vitalblaze/shared';

export function calculateCartTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vat = items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (item.vatRate / 100), 0);
  const total = subtotal + vat;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    vat: Number(vat.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

export function buildCartLine(product, quantity = 1, overrides = {}) {
  return {
    id: `${product.id}-${Date.now()}`,
    productId: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    sku: product.sku,
    quantity,
    unitPrice: Number(overrides.unitPrice ?? product.sellingPrice),
    vatRate: Number(product.vatRate || 15),
    isWeighedItem: Boolean(product.isWeighedItem),
    scalePayload: overrides.scalePayload || null,
  };
}

export function resolveScannedProduct(barcode, products) {
  const directMatch = products.find((product) => product.barcode === barcode);

  if (directMatch) {
    return {
      product: directMatch,
      quantity: 1,
      unitPrice: directMatch.sellingPrice,
      scalePayload: null,
    };
  }

  const resolved = resolveScaleBarcodeProduct(barcode, products);

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

const utf8Encoder = new TextEncoder();

function encodeUtf8(value) {
  return Array.from(utf8Encoder.encode(String(value)));
}

function encodeTlvEntry(tag, value) {
  const encodedValue = encodeUtf8(value);

  if (encodedValue.length > 255) {
    throw new Error(`ZATCA TLV value for tag ${tag} exceeds the one-byte length limit.`);
  }

  return [tag, encodedValue.length, ...encodedValue];
}

function toBase64(bytes) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(Uint8Array.from(bytes)).toString('base64');
  }

  if (typeof btoa !== 'undefined') {
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary);
  }

  throw new Error('No Base64 encoder is available in the current runtime.');
}

export function buildZatcaTlvBytes(sellerName, vatNumber, timestamp, total, vatAmount) {
  const normalizedVatNumber = String(vatNumber).trim();
  const normalizedTimestamp = timestamp instanceof Date ? timestamp.toISOString() : String(timestamp).trim();
  const normalizedTotal = Number(total).toFixed(2);
  const normalizedVatAmount = Number(vatAmount).toFixed(2);

  if (!sellerName || !String(sellerName).trim()) {
    throw new Error('Seller name is required to generate a ZATCA QR payload.');
  }

  if (!/^\d{15}$/.test(normalizedVatNumber)) {
    throw new Error('VAT number must be exactly 15 digits for ZATCA QR generation.');
  }

  if (Number.isNaN(Date.parse(normalizedTimestamp))) {
    throw new Error('Timestamp must be a valid ISO-8601 date string or Date instance.');
  }

  if (!Number.isFinite(Number(total)) || !Number.isFinite(Number(vatAmount))) {
    throw new Error('Total and VAT amount must be valid numeric values.');
  }

  return [
    ...encodeTlvEntry(1, String(sellerName).trim()),
    ...encodeTlvEntry(2, normalizedVatNumber),
    ...encodeTlvEntry(3, normalizedTimestamp),
    ...encodeTlvEntry(4, normalizedTotal),
    ...encodeTlvEntry(5, normalizedVatAmount),
  ];
}

export function generateZatcaQR(sellerName, vatNumber, timestamp, total, vatAmount) {
  return toBase64(buildZatcaTlvBytes(sellerName, vatNumber, timestamp, total, vatAmount));
}

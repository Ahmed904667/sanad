const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

export async function receiptFileToDataUrl(file: File): Promise<string> {
  if (!ALLOWED_RECEIPT_TYPES.has(file.type)) {
    throw new Error('Choose a JPG, PNG, WebP, or PDF receipt.');
  }
  if (file.size === 0 || file.size > MAX_RECEIPT_BYTES) {
    throw new Error('Receipt files must be 5 MB or smaller.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Could not read the receipt file.'));
    reader.onerror = () => reject(new Error('Could not read the receipt file.'));
    reader.readAsDataURL(file);
  });
}

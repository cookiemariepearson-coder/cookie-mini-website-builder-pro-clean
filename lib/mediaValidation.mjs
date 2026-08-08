export const IMAGE_UPLOAD_RULES = Object.freeze({
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxSourceBytes: 8 * 1024 * 1024,
  maxStoredBytes: 2 * 1024 * 1024,
  maxDimension: 6000,
  maxPixels: 24_000_000,
  maxImages: 12,
  maxUrlLength: 2048
});

export function safeMediaLabel(value = '', fallback = 'Uploaded image') {
  const base = String(value || '').split(/[\\/]/).pop() || fallback;
  const cleaned = base.replace(/[\u0000-\u001f\u007f<>"'`]/g, '').replace(/\s+/g, ' ').trim();
  return (cleaned || fallback).slice(0, 100);
}

function pngDimensions(buffer) {
  if (buffer.length < 24 || buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (!length || length < 2) return null;
    offset += length + 2;
  }
  return null;
}

function webpDimensions(buffer) {
  if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') return null;
  const kind = buffer.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  if (kind === 'VP8L' && buffer[20] === 0x2f) {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (kind === 'VP8 ' && buffer.length >= 30) return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  return null;
}

function dimensionsFor(buffer, mime) {
  if (mime === 'image/png') return pngDimensions(buffer);
  if (mime === 'image/jpeg') return jpegDimensions(buffer);
  if (mime === 'image/webp') return webpDimensions(buffer);
  return null;
}

export function validateStoredImageDataUrl(value) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=]+)$/i.exec(String(value || ''));
  if (!match) return { ok: false, error: 'Only JPEG, PNG, or WebP images are supported.' };
  const mime = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > IMAGE_UPLOAD_RULES.maxStoredBytes) {
    return { ok: false, error: 'That image is too large after processing. Choose a smaller image.' };
  }
  const dimensions = dimensionsFor(buffer, mime);
  if (!dimensions?.width || !dimensions?.height) return { ok: false, error: 'That image file is damaged or unsupported.' };
  if (dimensions.width > IMAGE_UPLOAD_RULES.maxDimension || dimensions.height > IMAGE_UPLOAD_RULES.maxDimension || dimensions.width * dimensions.height > IMAGE_UPLOAD_RULES.maxPixels) {
    return { ok: false, error: 'That image has dimensions that are too large.' };
  }
  return { ok: true, mime, bytes: buffer.length, ...dimensions };
}

export function validateMediaUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return { ok: true };
  if (raw.length > IMAGE_UPLOAD_RULES.maxUrlLength) return { ok: false, error: 'That media link is too long.' };
  try {
    const url = new URL(raw);
    return ['https:', 'http:'].includes(url.protocol)
      ? { ok: true }
      : { ok: false, error: 'Media links must begin with https:// or http://.' };
  } catch {
    return { ok: false, error: 'Enter a complete media link beginning with https://.' };
  }
}

export function validateSiteMedia(site = {}) {
  if (!site || typeof site !== 'object' || Array.isArray(site)) return { ok: false, error: 'Website data is invalid.' };
  let serialized;
  try { serialized = JSON.stringify(site); } catch { return { ok: false, error: 'Website data could not be read.' }; }
  if (Buffer.byteLength(serialized, 'utf8') > 7 * 1024 * 1024) return { ok: false, error: 'This website draft is too large. Remove one or more images and try again.' };

  const media = Array.isArray(site.media) ? site.media : [];
  if (media.length > 20) return { ok: false, error: 'Add no more than 20 media items to one website.' };
  const imageValues = [];
  if (String(site.heroImage || '').startsWith('data:')) imageValues.push(site.heroImage);
  for (const item of media) {
    if (!item || typeof item !== 'object') return { ok: false, error: 'One media item is invalid.' };
    if (item.kind === 'image' || String(item.url || '').startsWith('data:')) imageValues.push(item.url);
    else {
      const link = validateMediaUrl(item.url);
      if (!link.ok) return link;
    }
  }
  if (imageValues.length > IMAGE_UPLOAD_RULES.maxImages) return { ok: false, error: `Add no more than ${IMAGE_UPLOAD_RULES.maxImages} uploaded images to one website.` };
  for (const image of imageValues) {
    const result = validateStoredImageDataUrl(image);
    if (!result.ok) return result;
  }
  return { ok: true, imageCount: imageValues.length };
}

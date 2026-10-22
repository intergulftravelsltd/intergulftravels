import sharp from 'sharp';

export const ACCEPTED_UPLOAD_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/tiff',
  'image/bmp',
];

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12MB pre-conversion

export interface WebpResult {
  buffer: Buffer;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Convert ANY supported raster image to an optimized WebP.
 *
 * This is the single choke-point that enforces the "every image on the site is
 * WebP" rule — both the convert-public-folder script and the admin upload API
 * route call this, so a JPG/PNG can never reach storage in its original format.
 */
export async function toOptimizedWebp(
  input: Buffer | Uint8Array,
  opts: { maxWidth?: number; quality?: number } = {},
): Promise<WebpResult> {
  const { maxWidth = 1920, quality = 80 } = opts;

  const pipeline = sharp(input, { failOn: 'none' }).rotate(); // honour EXIF orientation

  const meta = await pipeline.metadata();
  if (meta.width && meta.width > maxWidth) {
    pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }

  const buffer = await pipeline
    .webp({ quality, effort: 5, smartSubsample: true })
    .toBuffer();

  const out = await sharp(buffer).metadata();
  return {
    buffer,
    width: out.width ?? 0,
    height: out.height ?? 0,
    bytes: buffer.length,
  };
}

export interface SignaturePng {
  buffer: Buffer;
  width: number;
  height: number;
}

/**
 * Turn a photo / scan of a signature on white paper into a transparent PNG
 * holding only the ink: the paper tone is estimated from the image itself,
 * everything close to it becomes transparent (soft edges keep anti-aliasing),
 * the result is cropped to the ink's bounding box and scaled down.
 * Throws when no ink can be found (blank paper).
 */
export async function signatureToPng(
  input: Buffer | Uint8Array,
  opts: { maxWidth?: number } = {},
): Promise<SignaturePng> {
  const { maxWidth = 800 } = opts;
  const { data, info } = await sharp(input, { failOn: 'none' })
    .rotate()
    .flatten({ background: '#ffffff' })
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .median(3) // knock out dust / sensor noise before thresholding
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const n = width * height;

  // Luminance histogram → the paper is the bright mass (85th percentile).
  const lum = new Uint8Array(n);
  const hist = new Uint32Array(256);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const l = Math.round(0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]);
    lum[i] = l;
    hist[l]++;
  }
  let acc = 0;
  let paper = 255;
  for (let l = 0; l < 256; l++) {
    acc += hist[l];
    if (acc >= n * 0.85) {
      paper = l;
      break;
    }
  }
  // Fully opaque ink below inkEnd, transparent paper above inkStart, soft in between.
  const inkStart = Math.max(60, Math.min(235, paper - 28));
  const inkEnd = Math.max(20, Math.min(inkStart - 10, paper - 110));

  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const l = lum[i];
    const a = l >= inkStart ? 0 : l <= inkEnd ? 255 : Math.round((255 * (inkStart - l)) / (inkStart - inkEnd));
    data[p + 3] = a;
    if (a > 40) {
      const x = i % width;
      const y = (i - x) / width;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0 || maxX - minX < 8 || maxY - minY < 8) {
    throw new Error('No signature ink was found in the image.');
  }

  const pad = 12;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const cropW = Math.min(width - left, maxX - minX + 1 + pad * 2);
  const cropH = Math.min(height - top, maxY - minY + 1 + pad * 2);

  const buffer = await sharp(data, { raw: { width, height, channels: 4 } })
    .extract({ left, top, width: cropW, height: cropH })
    .resize({ width: maxWidth, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const out = await sharp(buffer).metadata();
  return { buffer, width: out.width ?? 0, height: out.height ?? 0 };
}

/** Force a `.webp` extension on any filename. */
export function toWebpFilename(name: string) {
  const base = name.replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
  return `${base || 'image'}.webp`;
}

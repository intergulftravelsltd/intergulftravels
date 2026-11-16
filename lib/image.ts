import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';

/* ------------------------------------------------------------------ *
 *  Image processing without native modules (runs on Cloudflare Workers).
 *  - Converting uploads to WebP and resizing uses the Cloudflare IMAGES
 *    binding (wrangler.jsonc → "images"). Without the binding (plain
 *    `next dev`) the original file is stored unchanged.
 *  - The signature cut-out is pure JavaScript (pngjs / jpeg-js decode,
 *    pixel maths, pngjs encode); the binding is used only to normalise
 *    exotic formats and EXIF rotation to a PNG first when it is present.
 * ------------------------------------------------------------------ */

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

/* ------------------------- Cloudflare IMAGES binding ------------------------- */

type TransformOpts = { width?: number; height?: number; fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad' };
type OutputOpts = { format: 'image/webp' | 'image/png' | 'image/jpeg' | 'image/avif'; quality?: number };
type Transformer = {
  transform(opts: TransformOpts): Transformer;
  output(opts: OutputOpts): Promise<{ response(): Response; contentType(): string }>;
};
type ImagesBinding = {
  input(stream: ReadableStream<Uint8Array>): Transformer;
  info?(stream: ReadableStream<Uint8Array>): Promise<{ format: string; fileSize: number; width?: number; height?: number }>;
};

async function imagesBinding(): Promise<ImagesBinding | null> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext({ async: true });
    return ((env as unknown as Record<string, unknown>).IMAGES as ImagesBinding | undefined) ?? null;
  } catch {
    return null;
  }
}

const toStream = (bytes: Uint8Array): ReadableStream<Uint8Array> =>
  new Response(bytes.slice().buffer as ArrayBuffer).body as ReadableStream<Uint8Array>;

const asBytes = (input: Buffer | Uint8Array): Uint8Array =>
  input instanceof Uint8Array ? input : new Uint8Array(input);

/* ------------------------------ sniffing --------------------------------- */

function sniff(bytes: Uint8Array): 'png' | 'jpeg' | 'webp' | 'gif' | 'unknown' {
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpeg';
  if (bytes.length > 12 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'webp';
  if (bytes.length > 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'gif';
  return 'unknown';
}

const MIME: Record<string, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };

/** Width / height from the file header (PNG, JPEG, WebP-VP8X, GIF); 0 when unknown. */
function headerSize(bytes: Uint8Array): { width: number; height: number } {
  const kind = sniff(bytes);
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  try {
    if (kind === 'png') return { width: dv.getUint32(16), height: dv.getUint32(20) };
    if (kind === 'gif') return { width: dv.getUint16(6, true), height: dv.getUint16(8, true) };
    if (kind === 'jpeg') {
      let i = 2;
      while (i + 9 < bytes.length) {
        if (bytes[i] !== 0xff) { i++; continue; }
        const marker = bytes[i + 1];
        const len = dv.getUint16(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: dv.getUint16(i + 5), width: dv.getUint16(i + 7) };
        }
        i += 2 + len;
      }
    }
    if (kind === 'webp' && bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x58) {
      return { width: 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)), height: 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) };
    }
  } catch {
    /* fall through */
  }
  return { width: 0, height: 0 };
}

/* ---------------------------- raster helpers ----------------------------- */

type Raster = { width: number; height: number; data: Uint8Array }; // RGBA

/** Decode PNG / JPEG to RGBA without native code. */
function decodeRaster(bytes: Uint8Array): Raster {
  const kind = sniff(bytes);
  if (kind === 'png') {
    const png = PNG.sync.read(Buffer.from(bytes));
    return { width: png.width, height: png.height, data: new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.byteLength) };
  }
  if (kind === 'jpeg') {
    const out = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 512 });
    return { width: out.width, height: out.height, data: out.data as Uint8Array };
  }
  throw new Error('Unsupported image format. Use PNG or JPG.');
}

/** Box-filter downscale so the longer side is at most `max` (never enlarges). */
function fitWithin(src: Raster, max: number): Raster {
  const scale = Math.min(1, max / Math.max(src.width, src.height));
  if (scale >= 1) return src;
  const w = Math.max(1, Math.round(src.width * scale));
  const h = Math.max(1, Math.round(src.height * scale));
  const out = new Uint8Array(w * h * 4);
  const sx = src.width / w;
  const sy = src.height / h;
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * sy);
    const y1 = Math.min(src.height, Math.max(y0 + 1, Math.floor((y + 1) * sy)));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * sx);
      const x1 = Math.min(src.width, Math.max(x0 + 1, Math.floor((x + 1) * sx)));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) {
        let p = (yy * src.width + x0) * 4;
        for (let xx = x0; xx < x1; xx++, p += 4) {
          r += src.data[p];
          g += src.data[p + 1];
          b += src.data[p + 2];
          a += src.data[p + 3];
          n++;
        }
      }
      const o = (y * w + x) * 4;
      out[o] = r / n;
      out[o + 1] = g / n;
      out[o + 2] = b / n;
      out[o + 3] = a / n;
    }
  }
  return { width: w, height: h, data: out };
}

function encodePng(r: Raster): Buffer {
  const png = new PNG({ width: r.width, height: r.height });
  png.data = Buffer.from(r.data.buffer, r.data.byteOffset, r.data.byteLength);
  return PNG.sync.write(png, { deflateLevel: 9 });
}

/* ------------------------------ public API -------------------------------- */

export interface WebpResult {
  buffer: Buffer;
  width: number;
  height: number;
  bytes: number;
  /** image/webp when converted; the original type when no converter is available. */
  contentType: string;
}

/**
 * Convert any supported raster image to an optimised WebP (resized to
 * `maxWidth`). Uses the Cloudflare IMAGES binding; without it (local dev)
 * the file is returned unchanged with its own content type.
 */
export async function toOptimizedWebp(
  input: Buffer | Uint8Array,
  opts: { maxWidth?: number; quality?: number } = {},
): Promise<WebpResult> {
  const { maxWidth = 1920, quality = 80 } = opts;
  const bytes = asBytes(input);
  const images = await imagesBinding();
  if (images) {
    const result = await images
      .input(toStream(bytes))
      .transform({ width: maxWidth, fit: 'scale-down' })
      .output({ format: 'image/webp', quality });
    const out = new Uint8Array(await result.response().arrayBuffer());
    let { width, height } = headerSize(out);
    if (!width && images.info) {
      try {
        const info = await images.info(toStream(out));
        width = info.width ?? 0;
        height = info.height ?? 0;
      } catch {
        /* dimensions stay 0 */
      }
    }
    return { buffer: Buffer.from(out), width, height, bytes: out.length, contentType: 'image/webp' };
  }
  const { width, height } = headerSize(bytes);
  const kind = sniff(bytes);
  return {
    buffer: Buffer.from(bytes),
    width,
    height,
    bytes: bytes.length,
    contentType: MIME[kind] ?? 'application/octet-stream',
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
  let bytes = asBytes(input);

  // Normalise exotic formats / EXIF rotation through the binding when present.
  const images = await imagesBinding();
  if (images && sniff(bytes) !== 'png') {
    try {
      const r = await images
        .input(toStream(bytes))
        .transform({ width: 1600, height: 1600, fit: 'scale-down' })
        .output({ format: 'image/png' });
      bytes = new Uint8Array(await r.response().arrayBuffer());
    } catch {
      /* decode the original below */
    }
  }

  const src = fitWithin(decodeRaster(bytes), 1600);
  const { width, height, data } = src;
  const n = width * height;

  // Flatten transparency onto white, then luminance.
  const lum = new Uint8Array(n);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const a = data[p + 3] / 255;
    const r = data[p] * a + 255 * (1 - a);
    const g = data[p + 1] * a + 255 * (1 - a);
    const b = data[p + 2] * a + 255 * (1 - a);
    data[p] = r;
    data[p + 1] = g;
    data[p + 2] = b;
    lum[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // 3×3 median on luminance — knocks out dust / sensor noise before thresholding.
  const med = new Uint8Array(n);
  const win = new Uint8Array(9);
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - 1), y1 = Math.min(height - 1, y + 1);
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - 1), x1 = Math.min(width - 1, x + 1);
      let k = 0;
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) win[k++] = lum[yy * width + xx];
      // insertion sort of ≤9 values, take the middle one
      for (let i = 1; i < k; i++) {
        const v = win[i];
        let j = i - 1;
        while (j >= 0 && win[j] > v) { win[j + 1] = win[j]; j--; }
        win[j + 1] = v;
      }
      med[y * width + x] = win[k >> 1];
    }
  }

  // Luminance histogram → the paper is the bright mass (85th percentile).
  const hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) hist[med[i]]++;
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
    const l = med[i];
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
  const crop = new Uint8Array(cropW * cropH * 4);
  for (let y = 0; y < cropH; y++) {
    const from = ((top + y) * width + left) * 4;
    crop.set(data.subarray(from, from + cropW * 4), y * cropW * 4);
  }

  const out = fitWithin({ width: cropW, height: cropH, data: crop }, Math.max(maxWidth, Math.round((maxWidth * cropH) / cropW)));
  const final = out.width > maxWidth ? fitWithin(out, maxWidth) : out;
  return { buffer: encodePng(final), width: final.width, height: final.height };
}

/** Force a `.webp` extension on any filename. */
export function toWebpFilename(name: string) {
  return toImageFilename(name, 'image/webp');
}

/** Clean filename with the extension that matches `contentType`. */
export function toImageFilename(name: string, contentType: string) {
  const ext =
    contentType === 'image/png' ? 'png' : contentType === 'image/jpeg' ? 'jpg' : contentType === 'image/gif' ? 'gif' : 'webp';
  const base = name.replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
  return `${base || 'image'}.${ext}`;
}

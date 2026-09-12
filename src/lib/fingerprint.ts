/**
 * The canonical content fingerprint, in the browser.
 *
 * This is what "Try it" runs on a file you drop into it, and it is deliberately
 * a real implementation rather than a demo: the whole promise of the provenance
 * API is that anybody can reproduce these hashes from the published rules, and
 * the most convincing way to say so is to do it in the reader's own browser,
 * with the file never leaving their machine.
 *
 * It is therefore also the **second** implementation of a format the studio
 * Worker owns, written from the same published rules. `verify:provenance` in
 * `studio` runs both over the same inputs and compares digests — see the
 * coupling table in the repo's AGENTS.md. If you change anything here, that is
 * what tells you whether you were allowed to.
 *
 * No dependencies, on purpose. `DecompressionStream` and `crypto.subtle` are
 * both platform, and this app's package installs are held for a week by the
 * npm proxy, so a zip reader and a PNG decoder are cheaper written than added.
 */

export type FingerprintForm = "png" | "json" | "bytes";

export interface FingerprintResult {
  name: string;
  /** Null when the file could not be decoded, or is too generic to register. */
  hash: string | null;
  form: FingerprintForm | null;
  /** Why there is no hash. Shown to the reader so a skip isn't silent. */
  skipped?: "undecodable" | "too-generic";
}

const DOMAIN: Record<FingerprintForm, string> = {
  png: "rpai/v1/png\n",
  json: "rpai/v1/json\n",
  bytes: "rpai/v1/bytes\n",
};

const MIN_DISTINCT_COLOURS = 4;
const MIN_JSON_CANONICAL_BYTES = 128;

const utf8 = (text: string) => new TextEncoder().encode(text);

async function sha256Hex(parts: Uint8Array[]): Promise<string> {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const joined = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    joined.set(part, at);
    at += part.length;
  }
  const digest = await crypto.subtle.digest("SHA-256", joined);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** zlib or raw deflate, whichever a caller's container uses. */
async function inflate(bytes: Uint8Array, format: "deflate" | "deflate-raw"): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// ---------------------------------------------------------------------------
// PNG
// ---------------------------------------------------------------------------

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const CHANNELS_BY_COLOR_TYPE: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

interface DecodedPng {
  width: number;
  height: number;
  /** RGBA8, row-major, no padding. */
  data: Uint8Array;
}

/**
 * A from-scratch non-interlaced PNG decoder.
 *
 * Not `<canvas>`, which would be four lines: a browser is entitled to apply the
 * image's colour profile on the way into a canvas, so `getImageData` can hand
 * back pixels that differ from the file's for a tagged PNG. A fingerprint that
 * depends on the reader's colour management is not a fingerprint.
 *
 * Covers what Minecraft packs actually contain: palette (including `tRNS`),
 * grayscale at 1/2/4/8, and 8- or 16-bit truecolour with or without alpha.
 */
async function decodePng(bytes: Uint8Array): Promise<DecodedPng> {
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) throw new Error("Not a PNG file");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette: Uint8Array | null = null;
  let paletteAlpha: Uint8Array | null = null;
  const idat: Uint8Array[] = [];

  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    const start = offset + 8;
    const data = bytes.subarray(start, start + length);

    if (type === "IHDR") {
      width = view.getUint32(start);
      height = view.getUint32(start + 4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "PLTE") {
      palette = data;
    } else if (type === "tRNS") {
      if (colorType === 3) paletteAlpha = data;
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset = start + length + 4; // past the trailing CRC
  }

  if (interlace !== 0) throw new Error("Interlaced PNGs are not supported");
  const channels = CHANNELS_BY_COLOR_TYPE[colorType];
  if (!channels) throw new Error(`Unsupported PNG colour type: ${colorType}`);
  if (![1, 2, 4, 8, 16].includes(bitDepth)) throw new Error(`Unsupported PNG bit depth: ${bitDepth}`);
  if (bitDepth < 8 && colorType !== 0 && colorType !== 3) throw new Error("Sub-byte depth needs grayscale or palette");
  if (colorType === 3 && !palette) throw new Error("Palette PNG missing PLTE");

  const compressedLength = idat.reduce((n, chunk) => n + chunk.length, 0);
  const compressed = new Uint8Array(compressedLength);
  let at = 0;
  for (const chunk of idat) {
    compressed.set(chunk, at);
    at += chunk.length;
  }
  const raw = await inflate(compressed, "deflate");

  // Per the spec the filter's back-reference is one pixel in BYTES, at least 1
  // — which is exactly 1 for every sub-byte format.
  const rowBytes = Math.ceil((width * channels * bitDepth) / 8);
  const bpp = Math.max(1, Math.ceil((channels * bitDepth) / 8));
  const unfiltered = new Uint8Array(height * rowBytes);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowBytes + 1);
    const filter = raw[rowStart];
    const outAt = y * rowBytes;
    const prevAt = outAt - rowBytes;
    for (let x = 0; x < rowBytes; x++) {
      const a = x >= bpp ? unfiltered[outAt + x - bpp] : 0;
      const b = y > 0 ? unfiltered[prevAt + x] : 0;
      const c = y > 0 && x >= bpp ? unfiltered[prevAt + x - bpp] : 0;
      const filtered = raw[rowStart + 1 + x];
      let value: number;
      switch (filter) {
        case 0:
          value = filtered;
          break;
        case 1:
          value = filtered + a;
          break;
        case 2:
          value = filtered + b;
          break;
        case 3:
          value = filtered + Math.floor((a + b) / 2);
          break;
        case 4:
          value = filtered + paeth(a, b, c);
          break;
        default:
          throw new Error(`Unsupported PNG filter type: ${filter}`);
      }
      unfiltered[outAt + x] = value & 0xff;
    }
  }

  const samplesPerRow = width * channels;
  const rowSamples = new Uint16Array(samplesPerRow);
  const readRow = (y: number) => {
    const rowAt = y * rowBytes;
    if (bitDepth === 8) {
      for (let i = 0; i < samplesPerRow; i++) rowSamples[i] = unfiltered[rowAt + i];
    } else if (bitDepth === 16) {
      // High byte only — the same 8-bit value, which is what the format is
      // hashed at. 16-bit textures do not occur in packs and would not survive
      // a round trip through anything that does.
      for (let i = 0; i < samplesPerRow; i++) rowSamples[i] = unfiltered[rowAt + i * 2];
    } else {
      const perByte = 8 / bitDepth;
      const mask = (1 << bitDepth) - 1;
      for (let i = 0; i < samplesPerRow; i++) {
        const byte = unfiltered[rowAt + Math.floor(i / perByte)];
        rowSamples[i] = (byte >> (8 - bitDepth * ((i % perByte) + 1))) & mask;
      }
    }
  };

  const rgba = new Uint8Array(width * height * 4);
  const grayScale = bitDepth < 8 ? 255 / ((1 << bitDepth) - 1) : 1;

  for (let y = 0; y < height; y++) {
    readRow(y);
    for (let x = 0; x < width; x++) {
      const s = x * channels;
      const p = (y * width + x) * 4;
      if (colorType === 3) {
        const idx = rowSamples[s];
        rgba[p] = palette![idx * 3];
        rgba[p + 1] = palette![idx * 3 + 1];
        rgba[p + 2] = palette![idx * 3 + 2];
        rgba[p + 3] = paletteAlpha && idx < paletteAlpha.length ? paletteAlpha[idx] : 255;
      } else if (colorType === 0) {
        const v = Math.round(rowSamples[s] * grayScale);
        rgba[p] = rgba[p + 1] = rgba[p + 2] = v;
        rgba[p + 3] = 255;
      } else if (colorType === 2) {
        rgba[p] = rowSamples[s];
        rgba[p + 1] = rowSamples[s + 1];
        rgba[p + 2] = rowSamples[s + 2];
        rgba[p + 3] = 255;
      } else if (colorType === 4) {
        rgba[p] = rgba[p + 1] = rgba[p + 2] = rowSamples[s];
        rgba[p + 3] = rowSamples[s + 1];
      } else {
        rgba[p] = rowSamples[s];
        rgba[p + 1] = rowSamples[s + 1];
        rgba[p + 2] = rowSamples[s + 2];
        rgba[p + 3] = rowSamples[s + 3];
      }
    }
  }

  return { width, height, data: rgba };
}

// ---------------------------------------------------------------------------
// Canonical forms
// ---------------------------------------------------------------------------

function canonicalNumber(value: number): string {
  if (!Number.isFinite(value)) return "null";
  const rounded = Math.round(value * 1e6) / 1e6;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

export function canonicalJson(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return canonicalNumber(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return "null";
}

function pngIsTrivial(decoded: DecodedPng): boolean {
  const seen = new Set<number>();
  for (let i = 0; i < decoded.data.length; i += 4) {
    const alpha = decoded.data[i + 3];
    const packed =
      alpha === 0
        ? 0
        : ((decoded.data[i] << 24) | (decoded.data[i + 1] << 16) | (decoded.data[i + 2] << 8) | alpha) >>> 0;
    seen.add(packed);
    if (seen.size >= MIN_DISTINCT_COLOURS) return false;
  }
  return true;
}

/**
 * One file's fingerprint, or why it hasn't got one.
 *
 * A skip is reported rather than swallowed: "we didn't hash your blank tile" is
 * information, and a widget that silently dropped files would look like it had
 * lost them.
 */
export async function fingerprintFile(name: string, bytes: Uint8Array): Promise<FingerprintResult> {
  const lower = name.toLowerCase();

  if (lower.endsWith(".png")) {
    let decoded: DecodedPng;
    try {
      decoded = await decodePng(bytes);
    } catch {
      return { name, hash: null, form: null, skipped: "undecodable" };
    }
    if (pngIsTrivial(decoded)) return { name, hash: null, form: null, skipped: "too-generic" };

    const pixels = new Uint8Array(decoded.data.length);
    for (let i = 0; i < decoded.data.length; i += 4) {
      if (decoded.data[i + 3] === 0) continue; // leaves 0,0,0,0
      pixels[i] = decoded.data[i];
      pixels[i + 1] = decoded.data[i + 1];
      pixels[i + 2] = decoded.data[i + 2];
      pixels[i + 3] = decoded.data[i + 3];
    }
    const hash = await sha256Hex([utf8(DOMAIN.png), utf8(`${decoded.width}x${decoded.height}\n`), pixels]);
    return { name, hash, form: "png" };
  }

  if (lower.endsWith(".json")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return { name, hash: null, form: null, skipped: "undecodable" };
    }
    const canonical = canonicalJson(parsed);
    if (canonical.length < MIN_JSON_CANONICAL_BYTES) return { name, hash: null, form: null, skipped: "too-generic" };
    return { name, hash: await sha256Hex([utf8(DOMAIN.json), utf8(canonical)]), form: "json" };
  }

  return { name, hash: await sha256Hex([utf8(DOMAIN.bytes), bytes]), form: "bytes" };
}

// ---------------------------------------------------------------------------
// Zip
// ---------------------------------------------------------------------------

/** Files a pack can hold that are worth hashing. Everything else is skipped. */
const HASHABLE = /\.(png|json|ogg)$/i;

/**
 * Reads a `.zip` far enough to get at its files, from the central directory.
 *
 * A resource pack IS a zip, so "drop a file in" means this or it means nothing.
 * Written out rather than pulled from npm for the reason in this file's header,
 * and it is a small job: walk the central directory backwards from the
 * end-of-central-directory record, then inflate each entry's raw deflate stream.
 *
 * Only stored (0) and deflate (8) entries — the two a resource pack ever uses.
 * Anything else is skipped rather than failing the whole archive.
 */
async function readZip(bytes: Uint8Array): Promise<{ name: string; bytes: Uint8Array }[]> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // The EOCD is at the end, after a comment of up to 64KB.
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a zip file");

  const entryCount = view.getUint16(eocd + 10, true);
  let at = view.getUint32(eocd + 16, true);
  const out: { name: string; bytes: Uint8Array }[] = [];

  for (let i = 0; i < entryCount && at + 46 <= bytes.length; i++) {
    if (view.getUint32(at, true) !== 0x02014b50) break;
    const method = view.getUint16(at + 10, true);
    const compressedSize = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    const localAt = view.getUint32(at + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength));
    at += 46 + nameLength + extraLength + commentLength;

    if (name.endsWith("/") || !HASHABLE.test(name)) continue;

    // The local header repeats the name and extra field, at its own lengths —
    // they are allowed to differ from the central directory's, so they must be
    // read here rather than reused.
    const localNameLength = view.getUint16(localAt + 26, true);
    const localExtraLength = view.getUint16(localAt + 28, true);
    const dataAt = localAt + 30 + localNameLength + localExtraLength;
    const raw = bytes.subarray(dataAt, dataAt + compressedSize);

    try {
      if (method === 0) out.push({ name, bytes: raw });
      else if (method === 8) out.push({ name, bytes: await inflate(raw, "deflate-raw") });
    } catch {
      // One unreadable entry is not a reason to lose the other nine hundred.
    }
  }

  return out;
}

/**
 * Fingerprints what the reader dropped in: loose files, or every hashable file
 * inside a `.zip`.
 *
 * Nothing here touches the network. That is the point of doing it in the
 * browser at all — a marketplace evaluating this can watch their own devtools
 * and see that the pack never left the machine, and only 64 hex characters ever
 * will.
 */
export async function fingerprintDropped(files: File[]): Promise<FingerprintResult[]> {
  const out: FingerprintResult[] = [];
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (/\.(zip|mcpack)$/i.test(file.name)) {
      let entries: { name: string; bytes: Uint8Array }[];
      try {
        entries = await readZip(bytes);
      } catch {
        out.push({ name: file.name, hash: null, form: null, skipped: "undecodable" });
        continue;
      }
      for (const entry of entries) out.push(await fingerprintFile(entry.name, entry.bytes));
    } else {
      out.push(await fingerprintFile(file.name, bytes));
    }
  }
  return out;
}

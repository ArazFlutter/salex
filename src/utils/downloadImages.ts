import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

const DOWNLOAD_TIMEOUT_MS = 15_000;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const uploadsDir = path.join(process.cwd(), 'uploads');

/**
 * Base URL of this API as reachable by the publish worker (for HTTP fallback when
 * listing images are stored as `/uploads/...` paths). Defaults to 127.0.0.1 + PORT.
 */
function getPublicApiOrigin(): string {
  const raw = process.env.PUBLIC_API_ORIGIN?.trim() || process.env.API_PUBLIC_ORIGIN?.trim();
  if (raw) {
    return raw.replace(/\/+$/, '');
  }
  const port = process.env.PORT ?? '4000';
  return `http://127.0.0.1:${port}`;
}

/** Turn root-relative or protocol-relative URLs into absolute HTTP(S) URLs for Node's http client. */
export function resolveImageDownloadUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  if (trimmed.startsWith('/')) {
    return `${getPublicApiOrigin()}${trimmed}`;
  }
  return trimmed;
}

/**
 * If the URL points at a file already on disk under ./uploads (same layout as Express static),
 * return that path so we can copy instead of HTTP (reliable when worker shares the filesystem).
 */
export function tryLocalUploadsFile(url: string): string | null {
  if (!url.startsWith('/uploads/')) {
    return null;
  }
  const name = (url.slice('/uploads/'.length).split('?')[0] ?? '').trim();
  if (!name || name.includes('/') || name.includes('..')) {
    return null;
  }
  const full = path.join(uploadsDir, name);
  try {
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      return full;
    }
  } catch {
    /* ignore */
  }
  return null;
}

const SUPPORTED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
]);

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/bmp': '.bmp',
  'image/svg+xml': '.svg',
};

export type DownloadedImage = {
  url: string;
  localPath: string;
};

export type DownloadResult = {
  images: DownloadedImage[];
  tempDir: string;
  skipped: { url: string; reason: string }[];
};

function inferExtension(url: string, contentType?: string): string | null {
  if (contentType) {
    const ext = MIME_TO_EXT[contentType.split(';')[0].trim().toLowerCase()];
    if (ext) return ext;
  }

  try {
    const parsed = new URL(url);
    const ext = path.extname(parsed.pathname).toLowerCase();
    if (SUPPORTED_EXTENSIONS.has(ext)) return ext;
  } catch {
    // invalid URL
  }

  return null;
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, { timeout: DOWNLOAD_TIMEOUT_MS }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, dest).then(resolve, reject);
        res.resume();
        return;
      }

      if (!res.statusCode || res.statusCode >= 400) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode ?? 'unknown'}`));
        return;
      }

      let bytesWritten = 0;
      const fileStream = fs.createWriteStream(dest);

      res.on('data', (chunk: Buffer) => {
        bytesWritten += chunk.length;
        if (bytesWritten > MAX_FILE_SIZE) {
          res.destroy();
          fileStream.destroy();
          try { fs.unlinkSync(dest); } catch { /* ignore */ }
          reject(new Error(`File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`));
        }
      });

      res.pipe(fileStream);
      fileStream.on('finish', () => fileStream.close(() => resolve()));
      fileStream.on('error', (err) => {
        try { fs.unlinkSync(dest); } catch { /* ignore */ }
        reject(err);
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Download timed out'));
    });

    req.on('error', reject);
  });
}

/**
 * Downloads images from URLs to a temporary directory.
 * Returns local file paths and a cleanup handle.
 * Broken URLs or unsupported formats are skipped with warnings.
 */
export async function downloadImages(imageUrls: string[]): Promise<DownloadResult> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'salex-img-'));
  const images: DownloadedImage[] = [];
  const skipped: { url: string; reason: string }[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];

    try {
      const localSource = tryLocalUploadsFile(url);
      const ext = localSource
        ? (() => {
            const e = path.extname(localSource).toLowerCase();
            return SUPPORTED_EXTENSIONS.has(e) ? e : '.jpg';
          })()
        : inferExtension(resolveImageDownloadUrl(url)) ?? '.jpg';
      const filename = `image-${i}${ext}`;
      const localPath = path.join(tempDir, filename);

      if (localSource) {
        await fs.promises.copyFile(localSource, localPath);
      } else {
        await downloadFile(resolveImageDownloadUrl(url), localPath);
      }

      if (!fs.existsSync(localPath) || fs.statSync(localPath).size === 0) {
        skipped.push({ url, reason: 'Empty file after download' });
        continue;
      }

      images.push({ url, localPath });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      skipped.push({ url, reason });
      console.log(`[downloadImages] skipped ${url}: ${reason}`);
    }
  }

  return { images, tempDir, skipped };
}

/**
 * Removes the temporary directory and all files in it.
 * Safe to call multiple times — silently ignores missing directories.
 */
export function cleanupDownloadedImages(tempDir: string): void {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // cleanup is best-effort
  }
}

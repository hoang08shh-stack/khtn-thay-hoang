import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveServerPort(): number {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--port' && argv[i + 1]) {
      const cliPort = Number(argv[i + 1]);
      if (Number.isFinite(cliPort) && cliPort > 0) return cliPort;
    } else if (argv[i].startsWith('--port=')) {
      const cliPort = Number(argv[i].split('=')[1]);
      if (Number.isFinite(cliPort) && cliPort > 0) return cliPort;
    }
  }
  // Avoid colliding with AI Studio's Nginx reverse proxy when NGINX_PORT === PORT (8080)
  if (
    process.env.NGINX_PORT &&
    process.env.PORT &&
    process.env.PORT === process.env.NGINX_PORT &&
    process.env.DEFAULT_APP_PORT
  ) {
    const appPort = Number(process.env.DEFAULT_APP_PORT);
    if (Number.isFinite(appPort) && appPort > 0) return appPort;
  }
  const envPort = Number(process.env.PORT || 3000);
  return Number.isFinite(envPort) && envPort > 0 ? envPort : 3000;
}

const PORT = resolveServerPort();
const IS_PROD = process.env.NODE_ENV === 'production';

const SNAPSHOT_PATH = path.resolve(__dirname, 'src/data/cmsSnapshot.json');
const PUBLIC_SNAPSHOT_PATH = path.resolve(__dirname, 'public/cms-snapshot.json');
const DIST_SNAPSHOT_PATH = path.resolve(__dirname, 'dist/cms-snapshot.json');
const UPLOADS_DIR = path.resolve(__dirname, 'public/assets/uploads');
const CHUNKS_TMP_DIR = path.resolve(__dirname, 'public/assets/uploads/.chunks_tmp');
const DIST_DIR = path.resolve(__dirname, 'dist');

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  'pdf',
  'ppt',
  'pptx',
  'doc',
  'docx',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'mp4',
  'webm',
  'html',
]);

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  html: 'application/octet-stream',
};

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC32_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function collectProjectFiles(rootDir: string): string[] {
  const result: string[] = [];
  const topFiles = [
    'index.html',
    'metadata.json',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'server.ts',
    'vercel.json',
    '.env.example',
  ];
  for (const f of topFiles) {
    if (fs.existsSync(path.join(rootDir, f))) {
      result.push(f);
    }
  }
  const walk = (relDir: string) => {
    const absDir = path.join(rootDir, relDir);
    if (!fs.existsSync(absDir)) return;
    for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
      if (entry.name === '.chunks_tmp') continue;
      const relPath = path.posix.join(relDir, entry.name);
      if (
        relPath === 'public/khtn-source-code.zip' ||
        relPath === 'public/khtn-cloudflare-dist.zip' ||
        relPath === 'public/404.html'
      ) {
        continue;
      }
      if (entry.isDirectory()) {
        walk(relPath);
      } else if (entry.isFile()) {
        result.push(relPath);
      }
    }
  };
  walk('src');
  walk('public');
  walk('supabase');
  return result;
}

function rebuildSourceCodeZip(rootDir: string): void {
  try {
    const files = collectProjectFiles(rootDir);
    const localParts: Buffer[] = [];
    const centralParts: Buffer[] = [];
    let offset = 0;

    for (const relPath of files) {
      const absPath = path.join(rootDir, relPath);
      const rawData = fs.readFileSync(absPath);
      const nameBuf = Buffer.from(relPath, 'utf-8');
      const crc = crc32(rawData);
      const compressed = zlib.deflateRawSync(rawData);

      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0);
      localHeader.writeUInt16LE(20, 4);
      localHeader.writeUInt16LE(0x0800, 6);
      localHeader.writeUInt16LE(8, 8);
      localHeader.writeUInt16LE(0, 10);
      localHeader.writeUInt16LE(0x596c, 12);
      localHeader.writeUInt32LE(crc, 14);
      localHeader.writeUInt32LE(compressed.length, 18);
      localHeader.writeUInt32LE(rawData.length, 22);
      localHeader.writeUInt16LE(nameBuf.length, 26);
      localHeader.writeUInt16LE(0, 28);

      const centralHeader = Buffer.alloc(46);
      centralHeader.writeUInt32LE(0x02014b50, 0);
      centralHeader.writeUInt16LE(20, 4);
      centralHeader.writeUInt16LE(20, 6);
      centralHeader.writeUInt16LE(0x0800, 8);
      centralHeader.writeUInt16LE(8, 10);
      centralHeader.writeUInt16LE(0, 12);
      centralHeader.writeUInt16LE(0x596c, 14);
      centralHeader.writeUInt32LE(crc, 16);
      centralHeader.writeUInt32LE(compressed.length, 20);
      centralHeader.writeUInt32LE(rawData.length, 24);
      centralHeader.writeUInt16LE(nameBuf.length, 28);
      centralHeader.writeUInt16LE(0, 30);
      centralHeader.writeUInt16LE(0, 32);
      centralHeader.writeUInt16LE(0, 34);
      centralHeader.writeUInt16LE(0, 36);
      centralHeader.writeUInt32LE(0, 38);
      centralHeader.writeUInt32LE(offset, 42);

      localParts.push(localHeader, nameBuf, compressed);
      centralParts.push(centralHeader, nameBuf);
      offset += localHeader.length + nameBuf.length + compressed.length;
    }

    const centralDirBuf = Buffer.concat(centralParts);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(files.length, 8);
    eocd.writeUInt16LE(files.length, 10);
    eocd.writeUInt32LE(centralDirBuf.length, 12);
    eocd.writeUInt32LE(offset, 16);
    eocd.writeUInt16LE(0, 20);

    const zipPath = path.resolve(rootDir, 'public/khtn-source-code.zip');
    const tmpZipPath = `${zipPath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpZipPath, Buffer.concat([...localParts, centralDirBuf, eocd]));
    fs.renameSync(tmpZipPath, zipPath);
  } catch (err) {
    console.warn('Could not rebuild khtn-source-code.zip:', err);
  }
}

function writeFileAtomic(targetPath: string, content: string | Buffer): void {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const tmpPath = `${targetPath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
  fs.writeFileSync(tmpPath, content);
  fs.renameSync(tmpPath, targetPath);
}

function normalizeHost(raw: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
  return cleaned.replace(/:(80|443)$/, '');
}

export function isSameOriginWriteAllowed(req: Request): boolean {
  const secFetchSite = String(req.headers['sec-fetch-site'] || '').trim().toLowerCase();
  if (secFetchSite === 'same-origin') return true;
  if (secFetchSite === 'cross-site') return false;

  const origin = req.headers.origin;
  if (!origin) return true;
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }

  const originHost = normalizeHost(parsedOrigin.host);
  const originHostname = parsedOrigin.hostname.toLowerCase();
  const allowedHosts = new Set<string>();
  const allowedHostnames = new Set<string>();

  const registerHost = (raw?: string | string[]) => {
    if (!raw) return;
    const list = Array.isArray(raw) ? raw : String(raw).split(',');
    for (const item of list) {
      const h = normalizeHost(item);
      if (!h) continue;
      allowedHosts.add(h);
      const hostnameOnly = h.split(':')[0];
      if (hostnameOnly) allowedHostnames.add(hostnameOnly);
      // Allow sibling ais-dev <-> ais-pre hostnames for the exact same app deployment
      if (hostnameOnly.startsWith('ais-dev-')) {
        allowedHostnames.add(`ais-pre-${hostnameOnly.slice('ais-dev-'.length)}`);
      } else if (hostnameOnly.startsWith('ais-pre-')) {
        allowedHostnames.add(`ais-dev-${hostnameOnly.slice('ais-pre-'.length)}`);
      }
    }
  };

  registerHost(req.headers['x-forwarded-host']);
  registerHost(req.headers.host);
  registerHost(process.env.APP_URL);
  registerHost(process.env.NG_ALLOWED_HOSTS);

  if (allowedHosts.size === 0) return true;
  if (allowedHosts.has(originHost)) return true;

  // When running behind Nginx/Cloud Run where Host is rewritten to localhost:3000,
  // allow exact hostname matches against forwarded/configured app hosts (never unrelated domains).
  if (allowedHostnames.has(originHostname)) {
    const isLocalOrigin = originHostname === 'localhost' || originHostname === '127.0.0.1';
    if (!isLocalOrigin || allowedHosts.has(originHost)) {
      return true;
    }
  }

  return false;
}

function resolveConfinedUploadPath(rawFileName: string): string | null {
  const baseName = path.basename(rawFileName || '');
  if (!baseName || baseName === '.' || baseName === '..' || baseName.includes('\0')) {
    return null;
  }
  const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const resolved = path.resolve(UPLOADS_DIR, safeName);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep)) {
    return null;
  }
  return resolved;
}

function validateAndMakeUploadTarget(rawInputName: string): {
  ok: true;
  rawName: string;
  finalFileName: string;
  absFilePath: string;
  publicUrl: string;
} | { ok: false; status: number; error: string } {
  const rawName = path.basename(String(rawInputName || 'tai_lieu.pdf').trim());
  const ext = path.extname(rawName).replace(/^\./, '').toLowerCase();
  if (!ext || !ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      status: 400,
      error: `Định dạng .${ext || 'unknown'} không được hỗ trợ.`,
    };
  }
  const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const finalFileName = `${Date.now()}_${safeName}`;
  const absFilePath = resolveConfinedUploadPath(finalFileName);
  if (!absFilePath) {
    return { ok: false, status: 400, error: 'Tên tệp không hợp lệ.' };
  }
  return {
    ok: true,
    rawName,
    finalFileName,
    absFilePath,
    publicUrl: `/assets/uploads/${finalFileName}`,
  };
}

function readLatestSnapshotText(): string {
  const candidates = [SNAPSHOT_PATH, PUBLIC_SNAPSHOT_PATH, DIST_SNAPSHOT_PATH];
  let bestText = '';
  let bestMs = -1;
  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const text = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(text);
      const ms = typeof parsed?.updatedAt === 'string' ? Date.parse(parsed.updatedAt) || 0 : 0;
      if (ms > bestMs || (!bestText && text)) {
        bestMs = ms;
        bestText = text;
      }
    } catch {
      // ignore corrupted candidate
    }
  }
  return bestText || JSON.stringify({ updatedAt: '' });
}

interface ChunkSessionMeta {
  fileName: string;
  totalChunks: number;
  receivedChunks: Set<number>;
  totalBytes: number;
  createdAt: number;
}

export async function createApp() {
  const app = express();
  app.set('trust proxy', true);

  // Connected SSE clients for instant cross-device push (phones, laptops, other tabs)
  const sseClients = new Set<Response>();
  let liveSnapshotText: string = readLatestSnapshotText();
  const chunkSessions = new Map<string, ChunkSessionMeta>();

  // Ensure public/cms-snapshot.json (and dist/cms-snapshot.json if built) mirror latest snapshot immediately on boot
  try {
    if (liveSnapshotText && liveSnapshotText.length > 20) {
      writeFileAtomic(PUBLIC_SNAPSHOT_PATH, liveSnapshotText);
      if (fs.existsSync(DIST_DIR)) {
        writeFileAtomic(DIST_SNAPSHOT_PATH, liveSnapshotText);
      }
    }
  } catch {
    // non-fatal
  }

  const broadcastCmsUpdated = (updatedAt: string) => {
    const msg = `event: cms-updated\ndata: ${JSON.stringify({ updatedAt })}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(msg);
      } catch {
        sseClients.delete(client);
      }
    }
  };

  // Raw binary upload endpoints (must be registered BEFORE express.json)
  app.post(
    '/api/upload-teacher-file-raw',
    express.raw({ type: '*/*', limit: '30mb' }),
    (req: Request, res: Response) => {
      if (!isSameOriginWriteAllowed(req)) {
        res.status(403).json({ ok: false, error: 'Cross-origin upload rejected' });
        return;
      }
      try {
        const rawHeaderName = String(
          req.headers['x-file-name'] || req.query.fileName || 'tai_lieu.pdf'
        );
        const decodedName = (() => {
          try {
            return decodeURIComponent(rawHeaderName);
          } catch {
            return rawHeaderName;
          }
        })();
        const target = validateAndMakeUploadTarget(decodedName);
        if (!target.ok) {
          res.status(target.status).json({ ok: false, error: target.error });
          return;
        }
        const fileBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
        if (fileBuffer.length === 0) {
          res.status(400).json({ ok: false, error: 'Tệp rỗng không hợp lệ.' });
          return;
        }
        if (fileBuffer.length > MAX_UPLOAD_BYTES) {
          res.status(413).json({ ok: false, error: 'Tệp vượt quá giới hạn 50 MB.' });
          return;
        }
        writeFileAtomic(target.absFilePath, fileBuffer);
        res.status(200).json({
          ok: true,
          fileUrl: target.publicUrl,
          fileName: target.rawName,
          size: fileBuffer.length,
        });
      } catch (err: any) {
        res.status(400).json({ ok: false, error: err?.message || 'Raw upload failed' });
      }
    }
  );

  // Chunked binary upload endpoint (handles up to 50MB smoothly even behind 32MB Nginx proxy)
  app.post(
    '/api/upload-teacher-file-chunk',
    express.raw({ type: '*/*', limit: '10mb' }),
    (req: Request, res: Response) => {
      if (!isSameOriginWriteAllowed(req)) {
        res.status(403).json({ ok: false, error: 'Cross-origin upload rejected' });
        return;
      }
      try {
        const uploadId = String(req.headers['x-upload-id'] || '')
          .replace(/[^a-zA-Z0-9_-]/g, '')
          .slice(0, 64);
        const chunkIndex = Number(req.headers['x-chunk-index']);
        const totalChunks = Number(req.headers['x-total-chunks']);
        const rawHeaderName = String(req.headers['x-file-name'] || 'tai_lieu.pdf');
        const decodedName = (() => {
          try {
            return decodeURIComponent(rawHeaderName);
          } catch {
            return rawHeaderName;
          }
        })();

        if (
          !uploadId ||
          !Number.isInteger(chunkIndex) ||
          !Number.isInteger(totalChunks) ||
          chunkIndex < 0 ||
          totalChunks < 1 ||
          totalChunks > 64 ||
          chunkIndex >= totalChunks
        ) {
          res.status(400).json({ ok: false, error: 'Thông tin phân đoạn tệp không hợp lệ.' });
          return;
        }

        const precheck = validateAndMakeUploadTarget(decodedName);
        if (!precheck.ok) {
          res.status(precheck.status).json({ ok: false, error: precheck.error });
          return;
        }

        const chunkBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
        if (chunkBuffer.length === 0) {
          res.status(400).json({ ok: false, error: 'Phân đoạn tệp rỗng.' });
          return;
        }

        // Purge expired stale chunk sessions (> 15 min)
        const now = Date.now();
        for (const [key, meta] of chunkSessions.entries()) {
          if (now - meta.createdAt > 15 * 60 * 1000) {
            chunkSessions.delete(key);
            try {
              fs.rmSync(path.join(CHUNKS_TMP_DIR, key), { recursive: true, force: true });
            } catch {
              // ignore
            }
          }
        }

        let session = chunkSessions.get(uploadId);
        if (!session) {
          session = {
            fileName: decodedName,
            totalChunks,
            receivedChunks: new Set<number>(),
            totalBytes: 0,
            createdAt: now,
          };
          chunkSessions.set(uploadId, session);
        }

        if (session.totalBytes + chunkBuffer.length > MAX_UPLOAD_BYTES) {
          chunkSessions.delete(uploadId);
          try {
            fs.rmSync(path.join(CHUNKS_TMP_DIR, uploadId), { recursive: true, force: true });
          } catch {
            // ignore
          }
          res.status(413).json({ ok: false, error: 'Tệp vượt quá giới hạn 50 MB.' });
          return;
        }

        const sessionDir = path.resolve(CHUNKS_TMP_DIR, uploadId);
        if (!sessionDir.startsWith(CHUNKS_TMP_DIR + path.sep)) {
          res.status(400).json({ ok: false, error: 'Định danh phiên tải lên không hợp lệ.' });
          return;
        }
        fs.mkdirSync(sessionDir, { recursive: true });
        fs.writeFileSync(path.join(sessionDir, `part_${chunkIndex}`), chunkBuffer);
        if (!session.receivedChunks.has(chunkIndex)) {
          session.receivedChunks.add(chunkIndex);
          session.totalBytes += chunkBuffer.length;
        }

        if (session.receivedChunks.size < session.totalChunks) {
          res.status(200).json({
            ok: true,
            completed: false,
            received: session.receivedChunks.size,
            totalChunks: session.totalChunks,
          });
          return;
        }

        // All chunks received -> assemble atomically
        const parts: Buffer[] = [];
        for (let i = 0; i < session.totalChunks; i++) {
          parts.push(fs.readFileSync(path.join(sessionDir, `part_${i}`)));
        }
        const fullBuffer = Buffer.concat(parts);
        chunkSessions.delete(uploadId);
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch {
          // ignore
        }

        if (fullBuffer.length === 0 || fullBuffer.length > MAX_UPLOAD_BYTES) {
          res.status(413).json({ ok: false, error: 'Kích thước tệp sau ghép không hợp lệ.' });
          return;
        }

        writeFileAtomic(precheck.absFilePath, fullBuffer);
        res.status(200).json({
          ok: true,
          completed: true,
          fileUrl: precheck.publicUrl,
          fileName: precheck.rawName,
          size: fullBuffer.length,
        });
      } catch (err: any) {
        res.status(400).json({ ok: false, error: err?.message || 'Chunk upload failed' });
      }
    }
  );

  // Parse JSON bodies up to 75MB for base64 file uploads and CMS snapshots
  app.use('/api', express.json({ limit: '75mb' }));

  // 1. Dynamic file serving for teacher uploads (works in both dev & production without rebuild)
  const handleServeUploadedFile = (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    const requestedName = String(req.params.fileName || '');
    const resolved = resolveConfinedUploadPath(requestedName);
    if (!resolved || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
      res.status(404).json({ ok: false, error: 'File not found' });
      return;
    }

    const ext = path.extname(resolved).replace(/^\./, '').toLowerCase();
    const mimeType = MIME_BY_EXT[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (ext === 'html' || ext === 'htm' || ext === 'svg' || !MIME_BY_EXT[ext]) {
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(resolved)}"`);
    }
    res.sendFile(resolved);
  };

  app.get('/assets/uploads/:fileName', handleServeUploadedFile);
  app.get('/api/uploads/:fileName', handleServeUploadedFile);

  // 1B. Server-Sent Events stream for instant real-time cross-device updates (phones/tabs)
  app.get('/api/cms-events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    let currentUpdatedAt = '';
    try {
      const parsed = JSON.parse(liveSnapshotText || '{}');
      currentUpdatedAt = typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '';
    } catch {
      currentUpdatedAt = '';
    }

    res.write(`event: connected\ndata: ${JSON.stringify({ updatedAt: currentUpdatedAt })}\n\n`);
    sseClients.add(res);

    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  // 2. GET /api/cms-snapshot & /cms-snapshot.json — Always return freshest live CMS snapshot (no caching)
  const handleServeLiveSnapshot = (_req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const diskText = readLatestSnapshotText();
      if (diskText) {
        liveSnapshotText = diskText;
      }
      res.status(200).send(liveSnapshotText || JSON.stringify({ updatedAt: '' }));
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Read error' });
    }
  };

  app.get('/api/cms-snapshot', handleServeLiveSnapshot);
  app.get('/cms-snapshot.json', handleServeLiveSnapshot);

  // 2B. Lightweight version probe for low-bandwidth mobile polling
  app.get('/api/cms-version', (_req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      const diskText = readLatestSnapshotText();
      if (diskText) {
        liveSnapshotText = diskText;
      }
      const parsed = JSON.parse(liveSnapshotText || '{}');
      res.status(200).json({
        ok: true,
        updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : '',
        lessonCount: Array.isArray(parsed?.lessons) ? parsed.lessons.length : 0,
        assetCount:
          (Array.isArray(parsed?.generalAssets) ? parsed.generalAssets.length : 0) +
          (Array.isArray(parsed?.catalogDocs) ? parsed.catalogDocs.length : 0),
      });
    } catch {
      res.status(200).json({ ok: true, updatedAt: '', lessonCount: 0, assetCount: 0 });
    }
  });

  // 3. POST /api/upload-teacher-file — Store teacher documents persistently on server disk (JSON base64)
  app.post('/api/upload-teacher-file', (req: Request, res: Response) => {
    if (!isSameOriginWriteAllowed(req)) {
      res.status(403).json({ ok: false, error: 'Cross-origin upload rejected' });
      return;
    }
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const target = validateAndMakeUploadTarget(String(body.fileName || 'tai_lieu.pdf'));
      if (!target.ok) {
        res.status(target.status).json({ ok: false, error: target.error });
        return;
      }

      const dataUrl = String(body.dataUrl || '');
      const base64Idx = dataUrl.indexOf('base64,');
      if (base64Idx < 0) {
        res.status(400).json({ ok: false, error: 'Missing base64 dataUrl' });
        return;
      }

      const base64Data = dataUrl.slice(base64Idx + 7);
      const fileBuffer = Buffer.from(base64Data, 'base64');
      if (fileBuffer.length === 0) {
        res.status(400).json({ ok: false, error: 'Tệp rỗng không hợp lệ.' });
        return;
      }
      if (fileBuffer.length > MAX_UPLOAD_BYTES) {
        res.status(413).json({ ok: false, error: 'Tệp vượt quá giới hạn 50 MB.' });
        return;
      }

      writeFileAtomic(target.absFilePath, fileBuffer);
      res.status(200).json({
        ok: true,
        fileUrl: target.publicUrl,
        fileName: target.rawName,
        size: fileBuffer.length,
      });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err?.message || 'Upload failed' });
    }
  });

  // 4. POST /api/sync-cms-snapshot — Persist complete CMS snapshot atomically to disk & notify phones
  app.post('/api/sync-cms-snapshot', (req: Request, res: Response) => {
    if (!isSameOriginWriteAllowed(req)) {
      res.status(403).json({ ok: false, error: 'Cross-origin sync rejected' });
      return;
    }
    try {
      const parsed = req.body && typeof req.body === 'object' ? req.body : {};
      let existing: Record<string, any> = {};
      try {
        existing = JSON.parse(readLatestSnapshotText() || '{}');
      } catch {
        existing = {};
      }

      const parsedTime = typeof parsed.updatedAt === 'string' ? Date.parse(parsed.updatedAt) : NaN;
      const existingTime = typeof existing.updatedAt === 'string' ? Date.parse(existing.updatedAt) : NaN;
      const nowTime = Date.now();
      const monotonicMs = Math.max(
        nowTime,
        Number.isFinite(parsedTime) ? parsedTime : 0,
        Number.isFinite(existingTime) ? existingTime + 1 : 0
      );
      const finalUpdatedAt = new Date(monotonicMs).toISOString();

      const payload = {
        updatedAt: finalUpdatedAt,
        lessons: Array.isArray(parsed.lessons)
          ? parsed.lessons
          : Array.isArray(existing.lessons)
          ? existing.lessons
          : [],
        questions: Array.isArray(parsed.questions)
          ? parsed.questions
          : Array.isArray(existing.questions)
          ? existing.questions
          : [],
        quizzes: Array.isArray(parsed.quizzes)
          ? parsed.quizzes
          : Array.isArray(existing.quizzes)
          ? existing.quizzes
          : [],
        videos: Array.isArray(parsed.videos) ? parsed.videos : existing.videos,
        topics: Array.isArray(parsed.topics) ? parsed.topics : existing.topics,
        catalogDocs: Array.isArray(parsed.catalogDocs)
          ? parsed.catalogDocs
          : existing.catalogDocs,
        unifiedResources: Array.isArray(parsed.unifiedResources)
          ? parsed.unifiedResources
          : existing.unifiedResources,
        customLessons: Array.isArray(parsed.customLessons)
          ? parsed.customLessons
          : existing.customLessons,
        customTopics: Array.isArray(parsed.customTopics)
          ? parsed.customTopics
          : existing.customTopics,
        generalAssets: Array.isArray(parsed.generalAssets)
          ? parsed.generalAssets
          : existing.generalAssets,
        siteSettings:
          parsed.siteSettings && typeof parsed.siteSettings === 'object'
            ? parsed.siteSettings
            : existing.siteSettings,
        deletedIds:
          parsed.deletedIds && typeof parsed.deletedIds === 'object'
            ? parsed.deletedIds
            : existing.deletedIds,
      };

      const serialized = JSON.stringify(payload, null, 2);
      liveSnapshotText = serialized;

      // Persist atomically to src/data/cmsSnapshot.json + public/cms-snapshot.json (+ dist/ if built)
      writeFileAtomic(SNAPSHOT_PATH, serialized);
      try {
        writeFileAtomic(PUBLIC_SNAPSHOT_PATH, serialized);
      } catch {
        // non-fatal if public mirror cannot be written
      }
      if (fs.existsSync(DIST_DIR)) {
        try {
          writeFileAtomic(DIST_SNAPSHOT_PATH, serialized);
        } catch {
          // non-fatal
        }
      }

      const shouldRebuildZip =
        parsed.rebuildZip === true || String(req.query.rebuildZip || '') === '1';
      if (shouldRebuildZip) {
        rebuildSourceCodeZip(__dirname);
      }

      // Immediately push real-time notification to all open phones/tabs
      broadcastCmsUpdated(payload.updatedAt);

      res.status(200).json({
        ok: true,
        updatedAt: payload.updatedAt,
        rebuiltZip: Boolean(shouldRebuildZip),
      });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err?.message || 'Invalid JSON' });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built static assets from dist/ + dynamic public files
    app.use(
      express.static(DIST_DIR, {
        index: false,
      })
    );
    app.get(/.*/, (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/assets/uploads/')) {
        next();
        return;
      }
      const indexHtml = path.join(DIST_DIR, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.setHeader('Cache-Control', 'no-cache');
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build not found. Run npm run build first.');
      }
    });
  }

  return app;
}

const isDirectEntry =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectEntry) {
  createApp()
    .then((app) => {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(
          `KHTN Server running on http://0.0.0.0:${PORT} (${IS_PROD ? 'production' : 'dev'})`
        );
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}

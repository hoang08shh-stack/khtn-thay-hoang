import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export function rebuildSourceCodeZip(rootDir: string): void {
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
      localHeader.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
      localHeader.writeUInt16LE(8, 8); // deflate
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
    fs.writeFileSync(zipPath, Buffer.concat([...localParts, centralDirBuf, eocd]));
  } catch (err) {
    console.warn('Could not rebuild khtn-source-code.zip:', err);
  }
}

function cmsSnapshotSyncPlugin(): Plugin {
  const attachCmsMiddlewares = (middlewares: any) => {
    middlewares.use('/api/cms-snapshot', (req: any, res: any, next: any) => {
      if (req.method !== 'GET') {
        next();
        return;
      }
      try {
        const snapshotPath = path.resolve(__dirname, 'src/data/cmsSnapshot.json');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        if (fs.existsSync(snapshotPath)) {
          res.end(fs.readFileSync(snapshotPath, 'utf-8'));
        } else {
          res.end(JSON.stringify({ updatedAt: '' }));
        }
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: err?.message || 'Read error' }));
      }
    });

    middlewares.use('/api/upload-teacher-file', (req: any, res: any, next: any) => {
      if (req.method !== 'POST') {
        next();
        return;
      }
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      req.on('end', () => {
        try {
          const rawBody = Buffer.concat(chunks).toString('utf-8');
          const parsed = JSON.parse(rawBody || '{}');
          const rawName = String(parsed.fileName || 'tai_lieu.pdf');
          const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
          const dataUrl = String(parsed.dataUrl || '');
          const base64Idx = dataUrl.indexOf('base64,');
          if (base64Idx < 0) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: 'Missing base64 dataUrl' }));
            return;
          }
          const base64Data = dataUrl.slice(base64Idx + 7);
          const fileBuffer = Buffer.from(base64Data, 'base64');
          const uploadsDir = path.resolve(__dirname, 'public/assets/uploads');
          fs.mkdirSync(uploadsDir, { recursive: true });
          const finalFileName = `${Date.now()}_${safeName}`;
          const absFilePath = path.join(uploadsDir, finalFileName);
          fs.writeFileSync(absFilePath, fileBuffer);

          const publicUrl = `/assets/uploads/${finalFileName}`;
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, fileUrl: publicUrl, fileName: rawName }));
        } catch (err: any) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: err?.message || 'Upload failed' }));
        }
      });
    });

    middlewares.use('/api/sync-cms-snapshot', (req: any, res: any, next: any) => {
      if (req.method !== 'POST') {
        next();
        return;
      }
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      req.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString('utf-8');
          const parsed = JSON.parse(body || '{}');
          const snapshotPath = path.resolve(__dirname, 'src/data/cmsSnapshot.json');
          let existing: Record<string, any> = {};
          try {
            if (fs.existsSync(snapshotPath)) {
              existing = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8') || '{}');
            }
          } catch {
            existing = {};
          }

          const payload = {
            updatedAt: new Date().toISOString(),
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
          fs.writeFileSync(snapshotPath, JSON.stringify(payload, null, 2), 'utf-8');

          const shouldRebuildZip =
            parsed.rebuildZip === true || (req.url && req.url.includes('rebuildZip=1'));
          if (shouldRebuildZip) {
            rebuildSourceCodeZip(__dirname);
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ok: true,
              updatedAt: payload.updatedAt,
              rebuiltZip: Boolean(shouldRebuildZip),
            })
          );
        } catch (err: any) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: err?.message || 'Invalid JSON' }));
        }
      });
    });
  };

  return {
    name: 'cms-snapshot-sync',
    configureServer(server) {
      attachCmsMiddlewares(server.middlewares);
    },
    configurePreviewServer(server) {
      attachCmsMiddlewares(server.middlewares);
    },
    closeBundle() {
      try {
        // Ensure dist/404.html does NOT exist so Cloudflare Pages enables automatic SPA routing (/* /index.html 200)
        const dist404 = path.resolve(__dirname, 'dist/404.html');
        if (fs.existsSync(dist404)) {
          fs.unlinkSync(dist404);
        }
      } catch {
        // ignore
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cmsSnapshotSyncPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three') || id.includes('@react-three')) {
              return 'vendor-three';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/@supabase')) {
              return 'vendor-supabase';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

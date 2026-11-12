import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cmsSnapshotSyncPlugin(): Plugin {
  return {
    name: 'cms-snapshot-sync',
    configureServer(server) {
      server.middlewares.use('/api/sync-cms-snapshot', (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const snapshotPath = path.resolve(__dirname, 'src/data/cmsSnapshot.json');
            const payload = {
              updatedAt: new Date().toISOString(),
              lessons: Array.isArray(parsed.lessons) ? parsed.lessons : [],
              questions: Array.isArray(parsed.questions) ? parsed.questions : [],
              quizzes: Array.isArray(parsed.quizzes) ? parsed.quizzes : [],
              videos: Array.isArray(parsed.videos) ? parsed.videos : undefined,
              topics: Array.isArray(parsed.topics) ? parsed.topics : undefined,
              catalogDocs: Array.isArray(parsed.catalogDocs) ? parsed.catalogDocs : undefined,
              deletedIds: parsed.deletedIds && typeof parsed.deletedIds === 'object' ? parsed.deletedIds : undefined,
            };
            fs.writeFileSync(snapshotPath, JSON.stringify(payload, null, 2), 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, updatedAt: payload.updatedAt }));
          } catch (err: any) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: err?.message || 'Invalid JSON' }));
          }
        });
      });
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

/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

// Dev-only plugin: serves tools/photo-meta.html at /photo-meta.html
// Not included in production build (file lives outside public/)
const devToolsPlugin = {
  name: 'dev-tools',
  configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: { writeHead: (s: number, h: Record<string, string>) => void; end: (b: string) => void }, next: () => void) => void) => void } }) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/photo-meta.html') {
        const filePath = path.resolve(__dirname, 'tools/photo-meta.html');
        const html = fs.readFileSync(filePath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return;
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), devToolsPlugin],
  test: {
    globals: true,
    environment: 'node',
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});

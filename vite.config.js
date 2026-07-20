import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';

// MapView.jsx carga el plugin RTL como setRTLTextPlugin('/mapbox-gl-rtl-text.js'),
// asi que el archivo tiene que quedar en la raiz. vite-plugin-static-copy v4 aplana
// en serve pero preserva la ruta de origen en build (dist/index.js:630), lo que lo
// dejaba en /node_modules/@mapbox/... y daba 404 en produccion. Se resuelve aca para
// que dev y build usen la misma ruta, tomando el archivo de npm (sin copia vendorizada).
const RTL_TEXT_FILE = 'mapbox-gl-rtl-text.js';

const rtlTextPlugin = () => {
  // El paquete declara exports: "./src/index.js" (string plano), asi que la
  // subruta ./dist/ esta cerrada. Se resuelve el entrypoint permitido y se sube
  // a la raiz del paquete para tomar el bundle dist, que es el que espera
  // setRTLTextPlugin (trae el wasm embebido).
  const resolve = () => path.resolve(
    path.dirname(createRequire(import.meta.url).resolve('@mapbox/mapbox-gl-rtl-text')),
    '..',
    'dist',
    RTL_TEXT_FILE,
  );
  return {
    name: 'ubimax:rtl-text-root',
    configureServer(server) {
      server.middlewares.use(`/${RTL_TEXT_FILE}`, (req, res) => {
        res.setHeader('Content-Type', 'text/javascript');
        res.end(fs.readFileSync(resolve()));
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: RTL_TEXT_FILE,
        source: fs.readFileSync(resolve()),
      });
    },
  };
};

export default defineConfig(() => ({
  server: {
    port: 3000,
    proxy: {
      '/api/socket': {
        target: 'wss://rastreo.ubimaxgps.com',
        changeOrigin: true,
        ws: true,
      },
      '/api': {
        target: 'https://rastreo.ubimaxgps.com',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 1100,
  },
  plugins: [
    svgr(),
    react(),
    VitePWA({
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
        globPatterns: ['**/*.{js,css,html,woff,woff2,mp3}'],
      },
      manifest: {
        short_name: '${title}',
        name: '${description}',
        theme_color: '${colorPrimary}',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
    rtlTextPlugin(),
  ],
}));

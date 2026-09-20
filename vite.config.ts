import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function spaFallbackPlugin(): Plugin {
  return {
    name: 'spa-fallback',
    closeBundle() {
      const indexPath = resolve(process.cwd(), 'dist/index.html');
      const fallbackPath = resolve(process.cwd(), 'dist/404.html');
      if (existsSync(indexPath)) {
        copyFileSync(indexPath, fallbackPath);
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss(), spaFallbackPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});

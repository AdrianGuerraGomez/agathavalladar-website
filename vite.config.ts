import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/** Sustituye __SITE_URL__ en index.html por la URL pública (Open Graph necesita URLs absolutas). */
function siteUrlPlugin(siteUrl: string): Plugin {
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.VITE_SITE_URL ?? '').replace(/\/$/, '');
  return {
    plugins: [react(), siteUrlPlugin(siteUrl)],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
      target: 'es2022',
      sourcemap: false,
    },
  };
});

import { env } from './env';

export const SITE = {
  name: 'Agatha Valladar',
  wordmark: 'AGATHA VALLADAR',
  defaultTitle: 'Agatha Valladar — Política exterior y relaciones internacionales',
  defaultDescription:
    'Agatha Valladar, investigadora becada en el Instituto Franklin. Análisis sobre política exterior estadounidense, relaciones transatlánticas y Unión Europea.',
  defaultOgImage: '/og-default.png',
  archivePageSize: 6,
} as const;

export const absoluteUrl = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${env.siteUrl}${path.startsWith('/') ? '' : '/'}${path}`;

export const articlePath = (slug: string) => `/publicaciones/${slug}`;

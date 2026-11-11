/**
 * Genera supabase/seed.sql a partir de src/demo/content.ts.
 * Uso: npm run seed:generate
 */
import { writeFileSync } from 'node:fs';
import { demoArticles } from '../src/demo/content.ts';

const q = (v: string | null | undefined) => (v == null ? 'null' : `'${v.replace(/'/g, "''")}'`);
const json = (v: unknown) => (v == null ? 'null' : `${q(JSON.stringify(v))}::jsonb`);

const rows = demoArticles.map((a) => {
  const cover = { ...a.cover, width: 1600, height: 1000 };
  const secondary = a.secondary ? { ...a.secondary, width: 1600, height: 1000 } : null;
  return `  (${[
    q(a.slug),
    q(a.title),
    q(a.excerpt),
    q(a.body),
    json(cover),
    json(secondary),
    `(select id from public.categories where slug = ${q(a.category)})`,
    `'published'`,
    a.featured ? 'true' : 'false',
    q(a.published_at),
  ].join(',\n    ')})`;
});

const sql = `-- =============================================================================
-- CONTENIDO DE DEMOSTRACIÓN (opcional)
-- Generado por scripts/generate-seed.ts a partir de src/demo/content.ts.
-- Inserta artículos de ejemplo para ver el diseño con contenido.
-- Elimínalos desde el panel o con:
--   delete from public.articles where cover_image->>'path' like '/demo/%';
-- =============================================================================

insert into public.articles
  (slug, title, excerpt, body, cover_image, secondary_image, category_id, status, featured, published_at)
values
${rows.join(',\n')}
on conflict (slug) do nothing;
`;

writeFileSync(new URL('../supabase/seed.sql', import.meta.url), sql);
console.log(`supabase/seed.sql generado con ${demoArticles.length} artículos de demostración.`);

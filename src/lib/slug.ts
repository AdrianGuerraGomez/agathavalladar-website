/** Convierte un texto en un slug de URL: «Unión Europea» → «union-europea». */
export function slugify(input: string, maxLength = 90): string {
  const slug = input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length <= maxLength) return slug;
  return slug.slice(0, maxLength).replace(/-[^-]*$/, '') || slug.slice(0, maxLength);
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Normaliza texto de búsqueda igual que la columna `search` (sin acentos). */
export function normalizeSearch(input: string): string {
  return input.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

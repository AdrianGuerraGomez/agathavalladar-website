/** Utilidades compartidas por las funciones Edge. Solo usan la clave pública. */


export function getEnv() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';
  const siteUrl = (process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? '').replace(/\/$/, '');
  return { supabaseUrl, anonKey, siteUrl };
}

export async function supabaseSelect<T>(path: string): Promise<T | null> {
  const { supabaseUrl, anonKey } = getEnv();
  if (!supabaseUrl || !anonKey) return null;
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: 'application/json' },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function imagePublicUrl(path: string | undefined | null, siteUrl: string): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith('/')) return `${siteUrl}${path}`;
  const { supabaseUrl } = getEnv();
  return `${supabaseUrl}/storage/v1/object/public/article-images/${path.split('/').map(encodeURIComponent).join('/')}`;
}

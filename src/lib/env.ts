/**
 * Variables de entorno públicas. Solo se leen aquí.
 * Nunca deben contener claves privadas: todo lo que empieza por VITE_ llega al navegador.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '');

export const env = {
  supabaseUrl: url?.trim() || null,
  supabaseAnonKey: anonKey?.trim() || null,
  siteUrl: siteUrl || (typeof window !== 'undefined' ? window.location.origin : ''),
} as const;

/** Sin Supabase configurado la web pública funciona con contenido de demostración. */
export const isDemoMode = !env.supabaseUrl || !env.supabaseAnonKey;

if (import.meta.env.DEV && isDemoMode) {
  console.info(
    '[Agatha Valladar] Modo demostración: define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local para conectar Supabase.',
  );
}

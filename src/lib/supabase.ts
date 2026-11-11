import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isDemoMode } from './env';

/**
 * Cliente único de Supabase con la clave pública (anon).
 * La seguridad la garantizan las políticas RLS, no el frontend.
 * `null` en modo demostración.
 */
export const supabase: SupabaseClient | null = isDemoMode
  ? null
  : createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });

export const IMAGE_BUCKET = 'article-images';

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisa las variables de entorno.');
  }
  return supabase;
}

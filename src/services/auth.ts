import type { Session } from '@supabase/supabase-js';
import { requireSupabase, supabase } from '@/lib/supabase';
import { toAppError } from './errors';

export async function signIn(email: string, password: string): Promise<Session> {
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
  if (error) throw toAppError(error, 'No se pudo iniciar sesión.');
  return data.session;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback: (session: Session | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

/** Comprueba en la base de datos si el usuario actual es administrador. */
export async function checkIsAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('is_admin');
  if (error) throw toAppError(error, 'No se pudo verificar el acceso.');
  return data === true;
}

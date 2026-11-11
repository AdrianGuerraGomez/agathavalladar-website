import { requireSupabase, supabase } from '@/lib/supabase';
import type { ContactMessage } from '@/types/content';
import { AppError, toAppError } from './errors';

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/** Envía un mensaje del formulario. El visitante puede insertar, pero nunca leer. */
export async function sendContactMessage(input: ContactInput): Promise<void> {
  if (!supabase) throw new AppError('El formulario no está disponible en modo demostración.');
  const { error } = await supabase.from('contact_messages').insert({
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject.trim() || null,
    message: input.message.trim(),
  });
  if (error) throw toAppError(error, 'No se pudo enviar el mensaje. Inténtalo de nuevo.');
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  const { data, error } = await requireSupabase()
    .from('contact_messages')
    .select('id, name, email, subject, message, read, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw toAppError(error, 'No se pudieron cargar los mensajes.');
  return data ?? [];
}

export async function setMessageRead(id: string, read: boolean): Promise<void> {
  const { error } = await requireSupabase().from('contact_messages').update({ read }).eq('id', id);
  if (error) throw toAppError(error, 'No se pudo actualizar el mensaje.');
}

export async function deleteContactMessage(id: string): Promise<void> {
  const { error } = await requireSupabase().from('contact_messages').delete().eq('id', id);
  if (error) throw toAppError(error, 'No se pudo eliminar el mensaje.');
}

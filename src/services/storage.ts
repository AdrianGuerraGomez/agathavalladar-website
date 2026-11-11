import { processImage, type ImageFormat } from '@/lib/images';
import { IMAGE_BUCKET, requireSupabase } from '@/lib/supabase';
import type { ArticleImage } from '@/types/content';
import { toAppError } from './errors';

/** Comprime y sube una imagen. Devuelve la ruta y dimensiones. */
export async function uploadImage(file: File, format: ImageFormat = 'webp'): Promise<Pick<ArticleImage, 'path' | 'width' | 'height'>> {
  const processed = await processImage(file, format);
  const ext = processed.type === 'image/webp' ? 'webp' : processed.type === 'image/png' ? 'png' : 'jpg';
  const year = new Date().getFullYear();
  const path = `articles/${year}/${crypto.randomUUID()}.${ext}`;
  const { error } = await requireSupabase()
    .storage.from(IMAGE_BUCKET)
    .upload(path, processed.blob, { contentType: processed.type, cacheControl: '31536000', upsert: false });
  if (error) throw toAppError(error, 'No se pudo subir la imagen.');
  return { path, width: processed.width, height: processed.height };
}

/** Elimina imágenes del bucket (ignora rutas locales o externas). */
export async function deleteImages(paths: (string | null | undefined)[]): Promise<void> {
  const own = paths.filter((p): p is string => !!p && !p.startsWith('/') && !/^[a-z]+:/i.test(p));
  if (own.length === 0) return;
  const { error } = await requireSupabase().storage.from(IMAGE_BUCKET).remove(own);
  if (error && import.meta.env.DEV) console.warn('No se pudieron borrar imágenes antiguas', error);
}

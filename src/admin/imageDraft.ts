import { imageUrl } from '@/lib/images';
import type { ImageFormat } from '@/lib/images';
import { uploadImage } from '@/services/storage';
import type { ArticleImage } from '@/types/content';

/** Imagen en edición: puede ser una ya guardada (path) o un archivo pendiente de subir. */
export interface ImageDraft {
  path: string | null;
  file: File | null;
  previewUrl: string | null;
  alt: string;
  caption: string;
  width: number | null;
  height: number | null;
}

export function draftFromImage(image: ArticleImage | null): ImageDraft | null {
  if (!image) return null;
  return {
    path: image.path,
    file: null,
    previewUrl: imageUrl(image),
    alt: image.alt ?? '',
    caption: image.caption ?? '',
    width: image.width ?? null,
    height: image.height ?? null,
  };
}

/** Sube el archivo si es nuevo y devuelve la imagen lista para guardar. */
export async function resolveDraft(draft: ImageDraft | null, format: ImageFormat = 'webp'): Promise<ArticleImage | null> {
  if (!draft) return null;
  let { path, width, height } = draft;
  if (draft.file) {
    const uploaded = await uploadImage(draft.file, format);
    path = uploaded.path;
    width = uploaded.width ?? null;
    height = uploaded.height ?? null;
  }
  if (!path) return null;
  return { path, alt: draft.alt.trim(), caption: draft.caption.trim() || null, width, height };
}

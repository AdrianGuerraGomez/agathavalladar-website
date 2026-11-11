import { env } from './env';
import { IMAGE_BUCKET } from './supabase';
import type { ArticleImage } from '@/types/content';

/** URL pública de una imagen (ruta del bucket, ruta local o URL absoluta). */
export function imageUrl(image: Pick<ArticleImage, 'path'> | null | undefined): string | null {
  if (!image?.path) return null;
  const { path } = image;
  if (/^(https?:|blob:|data:)/.test(path) || path.startsWith('/')) return path;
  return `${env.supabaseUrl}/storage/v1/object/public/${IMAGE_BUCKET}/${path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  type: string;
}

const MAX_DIMENSION = 2400;
const QUALITY = 0.82;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const MAX_INPUT_BYTES = 25 * 1024 * 1024;

/**
 * Redimensiona (máx. 2400 px) y convierte a WebP en el navegador antes de subir.
 * Una foto de 6 MB suele quedar en 200–400 KB sin pérdida visible.
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Formato no admitido. Usa JPG, PNG, WebP o AVIF.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('La imagen supera los 25 MB.');
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', QUALITY));
  if (blob && blob.type === 'image/webp') {
    // Si la conversión no reduce el tamaño (p. ej. ya era WebP pequeño), conserva el original.
    if (scale === 1 && file.type === 'image/webp' && file.size <= blob.size) {
      return { blob: file, width, height, type: file.type };
    }
    return { blob, width, height, type: 'image/webp' };
  }
  // Navegadores sin codificador WebP: JPEG.
  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
  if (!jpeg) throw new Error('No se pudo comprimir la imagen.');
  return { blob: jpeg, width, height, type: 'image/jpeg' };
}

export function readImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}

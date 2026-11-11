import { z } from 'zod';
import { plainText, toLocalInputValue } from '@/lib/format';
import { SLUG_PATTERN } from '@/lib/slug';
import type { Article, ArticleStatus } from '@/types/content';
import { draftFromImage, type ImageDraft } from './imageDraft';

export interface ArticleFormState {
  title: string;
  slug: string;
  slugTouched: boolean;
  excerpt: string;
  body: string;
  cover: ImageDraft | null;
  secondary: ImageDraft | null;
  categoryId: string;
  status: ArticleStatus;
  featured: boolean;
  publishedAt: string; // valor de <input type="datetime-local">
  dateTouched: boolean;
  seoTitle: string;
  seoDescription: string;
}

export const LIMITS = { title: 300, excerpt: 600, slug: 120, seoTitle: 70, seoDescription: 160 } as const;

export function emptyForm(): ArticleFormState {
  return {
    title: '',
    slug: '',
    slugTouched: false,
    excerpt: '',
    body: '',
    cover: null,
    secondary: null,
    categoryId: '',
    status: 'draft',
    featured: false,
    publishedAt: toLocalInputValue(new Date().toISOString()),
    dateTouched: false,
    seoTitle: '',
    seoDescription: '',
  };
}

export function formFromArticle(a: Article): ArticleFormState {
  return {
    title: a.title,
    slug: a.slug,
    slugTouched: true,
    excerpt: a.excerpt,
    body: a.body,
    cover: draftFromImage(a.cover_image),
    secondary: draftFromImage(a.secondary_image),
    categoryId: a.category_id ?? '',
    status: a.status,
    featured: a.featured,
    publishedAt: toLocalInputValue(a.published_at),
    dateTouched: a.status === 'published',
    seoTitle: a.seo_title ?? '',
    seoDescription: a.seo_description ?? '',
  };
}

/** Instantánea comparable para detectar cambios sin guardar. */
export function snapshot(f: ArticleFormState): string {
  const img = (d: ImageDraft | null) => (d ? { p: d.path, f: d.file?.name ?? null, a: d.alt, c: d.caption } : null);
  return JSON.stringify({
    t: f.title, s: f.slug, e: f.excerpt, b: f.body, cv: img(f.cover), sc: img(f.secondary),
    c: f.categoryId, st: f.status, fe: f.featured, d: f.publishedAt, st2: f.seoTitle, sd: f.seoDescription,
  });
}

const imageSchema = z
  .object({ alt: z.string() })
  .nullable()
  .refine((v) => !v || v.alt.trim().length > 0, { message: 'Añade un texto alternativo.' });

export const articleSchema = z
  .object({
    title: z.string().trim().min(1, 'El título es obligatorio.').max(LIMITS.title, `Máximo ${LIMITS.title} caracteres.`),
    slug: z
      .string()
      .min(1, 'La URL es obligatoria.')
      .max(LIMITS.slug, `Máximo ${LIMITS.slug} caracteres.`)
      .regex(SLUG_PATTERN, 'Solo minúsculas, números y guiones (sin espacios ni acentos).'),
    excerpt: z.string().max(LIMITS.excerpt, `Máximo ${LIMITS.excerpt} caracteres.`),
    body: z.string(),
    cover: imageSchema,
    secondary: imageSchema,
    categoryId: z.string(),
    status: z.enum(['draft', 'published']),
    publishedAt: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), 'Fecha no válida.'),
    seoTitle: z.string().max(120, 'Máximo 120 caracteres.'),
    seoDescription: z.string().max(300, 'Máximo 300 caracteres.'),
  })
  .superRefine((f, ctx) => {
    if (f.status !== 'published') return;
    if (!f.excerpt.trim()) ctx.addIssue({ code: 'custom', path: ['excerpt'], message: 'La entradilla es obligatoria para publicar.' });
    if (!plainText(f.body)) ctx.addIssue({ code: 'custom', path: ['body'], message: 'El cuerpo del artículo está vacío.' });
    if (!f.cover) ctx.addIssue({ code: 'custom', path: ['cover'], message: 'La imagen principal es obligatoria para publicar.' });
    if (!f.categoryId) ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'Elige una categoría.' });
  });

export type FieldErrors = Partial<Record<'title' | 'slug' | 'excerpt' | 'body' | 'cover' | 'secondary' | 'categoryId' | 'publishedAt' | 'seoTitle' | 'seoDescription', string>>;

export function validate(f: ArticleFormState): FieldErrors {
  const res = articleSchema.safeParse(f);
  if (res.success) return {};
  const errors: FieldErrors = {};
  for (const issue of res.error.issues) {
    const key = issue.path[0] as keyof FieldErrors;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

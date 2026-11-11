import { normalizeSearch } from '@/lib/slug';
import { requireSupabase, supabase } from '@/lib/supabase';
import type {
  Article,
  ArticleDisplayStatus,
  ArticleInput,
  ArticleNeighbors,
  ArticleSummary,
  Paginated,
} from '@/types/content';
import { demoArticleList } from './demo';
import { toAppError } from './errors';

const CATEGORY_FIELDS = 'id, name, slug, description, sort_order';
const SUMMARY_FIELDS = `id, slug, title, excerpt, cover_image, category_id, status, featured, published_at, created_at, updated_at`;
const FULL_FIELDS = `${SUMMARY_FIELDS}, body, secondary_image, seo_title, seo_description`;

const nowIso = () => new Date().toISOString();

function summarize(a: Article): ArticleSummary {
  const { body: _b, secondary_image: _s, seo_title: _t, seo_description: _d, ...rest } = a;
  return rest;
}

export function displayStatus(a: Pick<Article, 'status' | 'published_at'>): ArticleDisplayStatus {
  if (a.status === 'draft') return 'draft';
  return new Date(a.published_at) > new Date() ? 'scheduled' : 'published';
}

function matchesQuery(a: Article, q: string) {
  const n = (s: string) => normalizeSearch(s).toLowerCase();
  const needle = n(q);
  return n(`${a.title} ${a.excerpt} ${a.body.replace(/<[^>]+>/g, ' ')}`).includes(needle);
}

// ---------------------------------------------------------------------------
// Web pública
// Las consultas filtran explícitamente lo publicado: aunque la administradora
// navegue la web con la sesión iniciada, nunca verá borradores en ella.
// ---------------------------------------------------------------------------

export interface ArchiveParams {
  page: number;
  pageSize: number;
  categorySlug?: string | null;
  query?: string | null;
}

export async function listPublishedArticles({
  page,
  pageSize,
  categorySlug,
  query,
}: ArchiveParams): Promise<Paginated<ArticleSummary>> {
  const from = (page - 1) * pageSize;

  if (!supabase) {
    let items = demoArticleList.filter((a) => a.published_at <= nowIso());
    if (categorySlug) items = items.filter((a) => a.category?.slug === categorySlug);
    if (query?.trim()) items = items.filter((a) => matchesQuery(a, query));
    return { items: items.slice(from, from + pageSize).map(summarize), total: items.length, page, pageSize };
  }

  const categoryJoin = categorySlug ? `category:categories!inner(${CATEGORY_FIELDS})` : `category:categories(${CATEGORY_FIELDS})`;
  let request = supabase
    .from('articles')
    .select(`${SUMMARY_FIELDS}, ${categoryJoin}`, { count: 'exact' })
    .eq('status', 'published')
    .lte('published_at', nowIso());

  if (categorySlug) request = request.eq('category.slug', categorySlug);
  if (query?.trim()) {
    request = request.textSearch('search', normalizeSearch(query), { type: 'websearch', config: 'spanish' });
  }

  const { data, error, count } = await request
    .order('published_at', { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw toAppError(error, 'No se pudieron cargar las publicaciones.');
  return { items: (data ?? []) as unknown as ArticleSummary[], total: count ?? 0, page, pageSize };
}

export async function listRecentArticles(limit: number): Promise<ArticleSummary[]> {
  const res = await listPublishedArticles({ page: 1, pageSize: limit });
  return res.items;
}

export async function listFeaturedArticles(limit: number): Promise<ArticleSummary[]> {
  if (!supabase) {
    return demoArticleList.filter((a) => a.featured && a.published_at <= nowIso()).slice(0, limit).map(summarize);
  }
  const { data, error } = await supabase
    .from('articles')
    .select(`${SUMMARY_FIELDS}, category:categories(${CATEGORY_FIELDS})`)
    .eq('status', 'published')
    .eq('featured', true)
    .lte('published_at', nowIso())
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw toAppError(error, 'No se pudieron cargar los artículos destacados.');
  return (data ?? []) as unknown as ArticleSummary[];
}

export async function getPublishedArticle(slug: string): Promise<Article | null> {
  if (!supabase) {
    return demoArticleList.find((a) => a.slug === slug && a.published_at <= nowIso()) ?? null;
  }
  const { data, error } = await supabase
    .from('articles')
    .select(`${FULL_FIELDS}, category:categories(${CATEGORY_FIELDS})`)
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', nowIso())
    .maybeSingle();
  if (error) throw toAppError(error, 'No se pudo cargar el artículo.');
  return (data as unknown as Article) ?? null;
}

export async function getArticleNeighbors(article: Pick<Article, 'id' | 'published_at'>): Promise<ArticleNeighbors> {
  if (!supabase) {
    const list = demoArticleList.filter((a) => a.published_at <= nowIso());
    const i = list.findIndex((a) => a.id === article.id);
    const pick = (a?: Article) => (a ? { slug: a.slug, title: a.title } : null);
    // La lista está en orden cronológico inverso: «anterior» = más antiguo.
    return { previous: pick(list[i + 1]), next: pick(list[i - 1]) };
  }
  const base = () => supabase!.from('articles').select('slug, title').eq('status', 'published').neq('id', article.id);
  const [older, newer] = await Promise.all([
    base().lt('published_at', article.published_at).order('published_at', { ascending: false }).limit(1).maybeSingle(),
    base()
      .gt('published_at', article.published_at)
      .lte('published_at', nowIso())
      .order('published_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  if (older.error || newer.error) throw toAppError(older.error ?? newer.error);
  return { previous: older.data ?? null, next: newer.data ?? null };
}

// ---------------------------------------------------------------------------
// Administración (requiere sesión de administradora; RLS lo garantiza)
// ---------------------------------------------------------------------------

export interface AdminListParams {
  status?: ArticleDisplayStatus | 'all';
  categoryId?: string | 'all';
  query?: string;
}

export async function listAdminArticles(): Promise<ArticleSummary[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('articles')
    .select(`${SUMMARY_FIELDS}, category:categories(${CATEGORY_FIELDS})`)
    .order('published_at', { ascending: false })
    .limit(1000);
  if (error) throw toAppError(error, 'No se pudieron cargar los artículos.');
  return (data ?? []) as unknown as ArticleSummary[];
}

export async function getArticleById(id: string): Promise<Article | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('articles')
    .select(`${FULL_FIELDS}, category:categories(${CATEGORY_FIELDS})`)
    .eq('id', id)
    .maybeSingle();
  if (error) throw toAppError(error, 'No se pudo cargar el artículo.');
  return (data as unknown as Article) ?? null;
}

export async function saveArticle(input: ArticleInput, id?: string): Promise<Article> {
  const db = requireSupabase();
  const request = id
    ? db.from('articles').update(input).eq('id', id)
    : db.from('articles').insert(input);
  const { data, error } = await request.select(`${FULL_FIELDS}, category:categories(${CATEGORY_FIELDS})`).single();
  if (error) throw toAppError(error, 'No se pudo guardar el artículo.');
  return data as unknown as Article;
}

export async function setArticleFields(id: string, fields: Partial<Pick<ArticleInput, 'status' | 'featured'>>) {
  const db = requireSupabase();
  const { error } = await db.from('articles').update(fields).eq('id', id);
  if (error) throw toAppError(error, 'No se pudo actualizar el artículo.');
}

export async function deleteArticle(id: string): Promise<Pick<Article, 'cover_image' | 'secondary_image'> | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from('articles')
    .delete()
    .eq('id', id)
    .select('cover_image, secondary_image')
    .maybeSingle();
  if (error) throw toAppError(error, 'No se pudo eliminar el artículo.');
  return data;
}

export async function isSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const db = requireSupabase();
  let q = db.from('articles').select('id', { count: 'exact', head: true }).eq('slug', slug);
  if (exceptId) q = q.neq('id', exceptId);
  const { count, error } = await q;
  if (error) throw toAppError(error);
  return (count ?? 0) > 0;
}

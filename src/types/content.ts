/** Modelo de dominio compartido por la web pública, el CMS y los servicios. */

export type ArticleStatus = 'draft' | 'published';

/** Estado derivado que ve la administradora. */
export type ArticleDisplayStatus = 'draft' | 'scheduled' | 'published';

export interface ArticleImage {
  /** Ruta en el bucket de Supabase o URL absoluta / ruta local (`/demo/...`). */
  path: string;
  alt: string;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image: ArticleImage | null;
  secondary_image: ArticleImage | null;
  category_id: string | null;
  category: Category | null;
  status: ArticleStatus;
  featured: boolean;
  published_at: string;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

/** Versión ligera para listados (sin cuerpo). */
export type ArticleSummary = Omit<Article, 'body' | 'secondary_image' | 'seo_title' | 'seo_description'>;

export interface ArticleNeighbors {
  previous: Pick<Article, 'slug' | 'title'> | null;
  next: Pick<Article, 'slug' | 'title'> | null;
}

export interface ResearchLine {
  title: string;
  description: string;
}

export interface SiteProfile {
  headline: string;
  home_intro: string;
  home_about: string;
  about_intro: string;
  research_profile: string;
  franklin: string;
  trajectory: string;
  research_lines: ResearchLine[];
  contact_email: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  location: string;
  updated_at?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Datos que envía el editor al guardar. */
export interface ArticleInput {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_image: ArticleImage | null;
  secondary_image: ArticleImage | null;
  category_id: string | null;
  status: ArticleStatus;
  featured: boolean;
  published_at: string;
  seo_title: string | null;
  seo_description: string | null;
}

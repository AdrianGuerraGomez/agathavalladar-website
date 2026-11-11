import { demoArticles, demoCategories } from '@/demo/content';
import type { Article, Category } from '@/types/content';

/** Repositorio en memoria para el modo demostración (solo lectura). */
export const demoCategoryList: Category[] = demoCategories.map((c) => ({
  id: `demo-${c.slug}`,
  name: c.name,
  slug: c.slug,
  description: null,
  sort_order: c.sort_order,
}));

export const demoArticleList: Article[] = demoArticles
  .map((a, i): Article => {
    const category = demoCategoryList.find((c) => c.slug === a.category) ?? null;
    return {
      id: `demo-${i + 1}`,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      body: a.body,
      cover_image: { ...a.cover, width: 1600, height: 1000 },
      secondary_image: a.secondary ? { ...a.secondary, width: 1600, height: 1000 } : null,
      category_id: category?.id ?? null,
      category,
      status: 'published',
      featured: a.featured,
      published_at: new Date(a.published_at).toISOString(),
      seo_title: null,
      seo_description: null,
      created_at: new Date(a.published_at).toISOString(),
      updated_at: new Date(a.published_at).toISOString(),
    };
  })
  .sort((a, b) => b.published_at.localeCompare(a.published_at));

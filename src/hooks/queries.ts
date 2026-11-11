import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getArticleById,
  getArticleNeighbors,
  getPublishedArticle,
  listAdminArticles,
  listFeaturedArticles,
  listPublishedArticles,
  listRecentArticles,
  type ArchiveParams,
} from '@/services/articles';
import { listCategories } from '@/services/categories';
import { getProfile } from '@/services/profile';
import type { Article } from '@/types/content';

export const queryKeys = {
  articles: ['articles'] as const,
  archive: (p: ArchiveParams) => ['articles', 'archive', p] as const,
  recent: (n: number) => ['articles', 'recent', n] as const,
  featured: (n: number) => ['articles', 'featured', n] as const,
  article: (slug: string) => ['articles', 'slug', slug] as const,
  neighbors: (id: string) => ['articles', 'neighbors', id] as const,
  admin: ['articles', 'admin'] as const,
  adminArticle: (id: string) => ['articles', 'admin', id] as const,
  categories: ['categories'] as const,
  profile: ['profile'] as const,
};

export const useArchive = (p: ArchiveParams) =>
  useQuery({ queryKey: queryKeys.archive(p), queryFn: () => listPublishedArticles(p), placeholderData: keepPreviousData });

export const useRecentArticles = (n: number) =>
  useQuery({ queryKey: queryKeys.recent(n), queryFn: () => listRecentArticles(n) });

export const useFeaturedArticles = (n: number) =>
  useQuery({ queryKey: queryKeys.featured(n), queryFn: () => listFeaturedArticles(n) });

export const useArticle = (slug: string) =>
  useQuery({ queryKey: queryKeys.article(slug), queryFn: () => getPublishedArticle(slug) });

export const useArticleNeighbors = (article: Article | null | undefined) =>
  useQuery({
    queryKey: queryKeys.neighbors(article?.id ?? ''),
    queryFn: () => getArticleNeighbors(article!),
    enabled: !!article,
  });

export const useCategories = () =>
  useQuery({ queryKey: queryKeys.categories, queryFn: listCategories, staleTime: 5 * 60_000 });

export const useProfile = () =>
  useQuery({ queryKey: queryKeys.profile, queryFn: getProfile, staleTime: 5 * 60_000 });

export const useAdminArticles = () => useQuery({ queryKey: queryKeys.admin, queryFn: listAdminArticles });

export const useAdminArticle = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.adminArticle(id ?? 'new'),
    queryFn: () => getArticleById(id!),
    enabled: !!id,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

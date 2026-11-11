import { requireSupabase, supabase } from '@/lib/supabase';
import type { Category } from '@/types/content';
import { demoCategoryList } from './demo';
import { toAppError } from './errors';

const FIELDS = 'id, name, slug, description, sort_order';

export async function listCategories(): Promise<Category[]> {
  if (!supabase) return demoCategoryList;
  const { data, error } = await supabase
    .from('categories')
    .select(FIELDS)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw toAppError(error, 'No se pudieron cargar las categorías.');
  return data ?? [];
}

export type CategoryInput = Pick<Category, 'name' | 'slug' | 'description' | 'sort_order'>;

export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data, error } = await requireSupabase().from('categories').insert(input).select(FIELDS).single();
  if (error) throw toAppError(error, 'No se pudo crear la categoría.');
  return data;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>): Promise<Category> {
  const { data, error } = await requireSupabase().from('categories').update(input).eq('id', id).select(FIELDS).single();
  if (error) throw toAppError(error, 'No se pudo actualizar la categoría.');
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await requireSupabase().from('categories').delete().eq('id', id);
  if (error) throw toAppError(error, 'No se pudo eliminar la categoría.');
}

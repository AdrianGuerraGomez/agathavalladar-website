import { defaultProfile } from '@/demo/profile';
import { requireSupabase, supabase } from '@/lib/supabase';
import type { SiteProfile } from '@/types/content';
import { toAppError } from './errors';

const FIELDS =
  'headline, home_intro, home_about, about_intro, research_profile, franklin, trajectory, research_lines, contact_email, linkedin_url, x_url, location, updated_at';

export async function getProfile(): Promise<SiteProfile> {
  if (!supabase) return defaultProfile;
  const { data, error } = await supabase.from('site_profile').select(FIELDS).eq('id', 1).maybeSingle();
  if (error) throw toAppError(error, 'No se pudo cargar el perfil.');
  return (data as SiteProfile | null) ?? defaultProfile;
}

export async function updateProfile(input: Omit<SiteProfile, 'updated_at'>): Promise<SiteProfile> {
  const { data, error } = await requireSupabase()
    .from('site_profile')
    .update(input)
    .eq('id', 1)
    .select(FIELDS)
    .single();
  if (error) throw toAppError(error, 'No se pudo guardar el perfil.');
  return data as SiteProfile;
}

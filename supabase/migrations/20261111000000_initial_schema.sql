-- =============================================================================
-- Agatha Valladar — esquema inicial
-- Tablas, búsqueda a texto completo, RLS y almacenamiento de imágenes.
-- Ejecutar una sola vez (SQL Editor de Supabase o `supabase db push`).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensiones y utilidades
-- -----------------------------------------------------------------------------
create extension if not exists unaccent with schema extensions;

-- unaccent() no es IMMUTABLE; este envoltorio sí, y permite usarlo en columnas
-- generadas e índices.
create or replace function public.f_unaccent(input text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, input)
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Administradores
-- Tabla sin políticas: no se puede leer ni escribir desde la API.
-- Se gestiona exclusivamente por SQL (ver README).
-- -----------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  )
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Categorías
-- -----------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 400),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Artículos
-- -----------------------------------------------------------------------------
create type public.article_status as enum ('draft', 'published');

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title text not null check (char_length(btrim(title)) between 1 and 300),
  excerpt text not null default '' check (char_length(excerpt) <= 600),
  body text not null default '',
  -- { "path": "...", "alt": "...", "caption": "...", "width": 0, "height": 0 }
  cover_image jsonb check (
    cover_image is null
    or (jsonb_typeof(cover_image) = 'object' and cover_image ? 'path' and cover_image ? 'alt')
  ),
  secondary_image jsonb check (
    secondary_image is null
    or (jsonb_typeof(secondary_image) = 'object' and secondary_image ? 'path' and secondary_image ? 'alt')
  ),
  category_id uuid references public.categories (id) on delete restrict,
  status public.article_status not null default 'draft',
  featured boolean not null default false,
  published_at timestamptz not null default now(),
  seo_title text check (seo_title is null or char_length(seo_title) <= 120),
  seo_description text check (seo_description is null or char_length(seo_description) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('spanish', public.f_unaccent(coalesce(title, ''))), 'A') ||
    setweight(to_tsvector('spanish', public.f_unaccent(coalesce(excerpt, ''))), 'B') ||
    setweight(
      to_tsvector('spanish', public.f_unaccent(regexp_replace(coalesce(body, ''), '<[^>]+>', ' ', 'g'))),
      'C'
    )
  ) stored,
  -- Un artículo publicado (o programado) debe estar completo.
  constraint articles_published_complete check (
    status = 'draft'
    or (
      cover_image is not null
      and category_id is not null
      and char_length(btrim(excerpt)) > 0
      and char_length(btrim(body)) > 0
    )
  )
);

create index articles_public_listing_idx on public.articles (status, published_at desc);
create index articles_category_idx on public.articles (category_id);
create index articles_featured_idx on public.articles (published_at desc) where featured;
create index articles_search_idx on public.articles using gin (search);

create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Perfil y textos de la web (fila única)
-- -----------------------------------------------------------------------------
create table public.site_profile (
  id smallint primary key default 1 check (id = 1),
  headline text not null default '',
  home_intro text not null default '',
  home_about text not null default '',
  about_intro text not null default '',        -- HTML
  research_profile text not null default '',   -- HTML
  franklin text not null default '',           -- HTML
  trajectory text not null default '',         -- HTML
  research_lines jsonb not null default '[]'::jsonb
    check (jsonb_typeof(research_lines) = 'array'),
  contact_email text,
  linkedin_url text,
  x_url text,
  location text not null default '',
  updated_at timestamptz not null default now()
);

create trigger site_profile_set_updated_at
  before update on public.site_profile
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.site_profile enable row level security;

-- Categorías: lectura pública, escritura solo administradora.
create policy "Categorías visibles para todos"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "Administradora crea categorías"
  on public.categories for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Administradora edita categorías"
  on public.categories for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Administradora elimina categorías"
  on public.categories for delete
  to authenticated
  using ((select public.is_admin()));

-- Artículos: el público solo ve lo publicado cuya fecha ya ha llegado.
-- Los borradores y los programados solo los ve la administradora.
create policy "Artículos publicados visibles para todos"
  on public.articles for select
  to anon, authenticated
  using (
    (status = 'published' and published_at <= now())
    or (select public.is_admin())
  );

create policy "Administradora crea artículos"
  on public.articles for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Administradora edita artículos"
  on public.articles for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Administradora elimina artículos"
  on public.articles for delete
  to authenticated
  using ((select public.is_admin()));

-- Perfil: lectura pública, edición solo administradora.
create policy "Perfil visible para todos"
  on public.site_profile for select
  to anon, authenticated
  using (true);

create policy "Administradora edita el perfil"
  on public.site_profile for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- Almacenamiento de imágenes
-- Bucket público para lectura por URL; solo la administradora sube/borra.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-images',
  'article-images',
  true,
  10485760, -- 10 MB
  array['image/webp', 'image/jpeg', 'image/png', 'image/avif']
)
on conflict (id) do nothing;

create policy "Administradora lista imágenes"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'article-images' and (select public.is_admin()));

create policy "Administradora sube imágenes"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'article-images' and (select public.is_admin()));

create policy "Administradora reemplaza imágenes"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'article-images' and (select public.is_admin()))
  with check (bucket_id = 'article-images' and (select public.is_admin()));

create policy "Administradora elimina imágenes"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'article-images' and (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- Datos iniciales (no son de demostración)
-- -----------------------------------------------------------------------------
insert into public.categories (name, slug, sort_order) values
  ('Estados Unidos', 'estados-unidos', 10),
  ('Unión Europea', 'union-europea', 20),
  ('Relaciones transatlánticas', 'relaciones-transatlanticas', 30),
  ('Geopolítica', 'geopolitica', 40),
  ('Política exterior', 'politica-exterior', 50),
  ('Relaciones internacionales', 'relaciones-internacionales', 60);

-- Textos basados únicamente en la información facilitada por la autora.
-- Todo es editable desde /admin/perfil.
insert into public.site_profile (
  id, headline, home_intro, home_about, about_intro, research_profile, franklin,
  trajectory, research_lines, location
) values (
  1,
  'Investigadora | Política exterior | Relaciones internacionales',
  'Análisis sobre la política exterior de Estados Unidos, las relaciones transatlánticas y el lugar de Europa en el orden internacional.',
  'Investigadora becada en el Instituto Franklin. Mi trabajo examina cómo se formula la política exterior estadounidense y qué consecuencias tiene para la Unión Europea y para la relación entre ambas orillas del Atlántico.',
  '<p>Soy investigadora becada en el Instituto Franklin. Mi actividad se centra en la investigación, el análisis y la publicación de artículos sobre política exterior estadounidense, relaciones internacionales y relaciones transatlánticas.</p>',
  '<p>Mi trabajo aborda la política exterior de Estados Unidos y sus efectos sobre Europa, el papel de la Unión Europea como actor internacional y la estrategia geopolítica que define la relación entre ambos.</p>',
  '<p>Desarrollo mi investigación como becaria en el Instituto Franklin.</p>',
  '',
  '[
    {"title": "Política exterior estadounidense", "description": "Prioridades, instituciones y procesos de decisión que definen el papel de Estados Unidos en el mundo."},
    {"title": "Relaciones transatlánticas", "description": "La relación entre Estados Unidos y Europa en seguridad, comercio y gobernanza global."},
    {"title": "Unión Europea", "description": "La acción exterior de la UE y su capacidad para actuar como actor geopolítico."},
    {"title": "Estrategia geopolítica", "description": "Competencia entre potencias, alianzas y equilibrios en el sistema internacional."},
    {"title": "Relaciones internacionales", "description": "Marcos analíticos para entender el orden internacional y sus transformaciones."}
  ]'::jsonb,
  'Guadalajara, Castilla-La Mancha, España'
);

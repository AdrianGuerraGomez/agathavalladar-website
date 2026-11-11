-- =============================================================================
-- Contacto: teléfono en el perfil y bandeja de mensajes del formulario.
-- =============================================================================

alter table public.site_profile
  add column if not exists contact_phone text
  check (contact_phone is null or char_length(contact_phone) <= 40);

-- Mensajes del formulario de contacto.
-- Cualquiera puede ENVIAR; solo la administradora puede LEER, marcar y borrar.
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text not null check (
    char_length(email) <= 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  subject text check (subject is null or char_length(subject) <= 200),
  message text not null check (char_length(btrim(message)) between 10 and 5000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index contact_messages_created_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

create policy "Cualquiera puede enviar un mensaje"
  on public.contact_messages for insert
  to anon, authenticated
  with check (read = false);

create policy "Administradora lee los mensajes"
  on public.contact_messages for select
  to authenticated
  using ((select public.is_admin()));

create policy "Administradora marca mensajes"
  on public.contact_messages for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Administradora elimina mensajes"
  on public.contact_messages for delete
  to authenticated
  using ((select public.is_admin()));

-- Datos de contacto PROVISIONALES (inventados). Cámbialos en /admin/perfil.
update public.site_profile
set contact_email = coalesce(contact_email, 'contacto@agathavalladar.es'),
    contact_phone = coalesce(contact_phone, '+34 949 000 000')
where id = 1;

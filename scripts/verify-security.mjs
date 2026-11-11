/**
 * Verificación de seguridad contra tu proyecto de Supabase real.
 *
 *   SUPABASE_URL=… SUPABASE_ANON_KEY=… node scripts/verify-security.mjs
 *
 * Opcional, para probar también el flujo de la administradora
 * (crea un borrador de prueba y lo borra al terminar):
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… (no se muestran en pantalla)
 *
 * Solo usa la clave pública (anon). Nunca necesita la service_role.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Define SUPABASE_URL y SUPABASE_ANON_KEY.');
  process.exit(1);
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
let failures = 0;
const ok = (msg) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
const fail = (msg, extra) => { failures++; console.log(`  \x1b[31m✗\x1b[0m ${msg}${extra ? ` — ${extra}` : ''}`); };
const check = (cond, msg, extra) => (cond ? ok(msg) : fail(msg, extra));

// --------------------------------------------------------------------------
console.log('\nVisitante anónimo');
const anon = createClient(url, key, opts);
const now = new Date().toISOString();

{
  const { data, error } = await anon.from('articles').select('id').eq('status', 'draft');
  check(!error && data.length === 0, 'No ve borradores', error?.message ?? `${data?.length} visibles`);
}
{
  const { data, error } = await anon.from('articles').select('id').gt('published_at', now);
  check(!error && data.length === 0, 'No ve artículos programados', error?.message ?? `${data?.length} visibles`);
}
{
  const { error } = await anon.from('articles').select('id, title').eq('status', 'published').limit(1);
  check(!error, 'Puede leer artículos publicados', error?.message);
}
{
  const { error } = await anon.from('articles').insert({ slug: 'intruso', title: 'x' });
  check(!!error, 'No puede crear artículos');
}
{
  const { data } = await anon.from('articles').update({ title: 'hackeado' }).neq('id', '00000000-0000-0000-0000-000000000000').select('id');
  check(!data || data.length === 0, 'No puede modificar artículos');
}
{
  const { data } = await anon.from('articles').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('id');
  check(!data || data.length === 0, 'No puede eliminar artículos');
}
{
  const { error } = await anon.from('categories').insert({ name: 'x', slug: 'intrusa' });
  check(!!error, 'No puede crear categorías');
}
{
  const { data } = await anon.from('site_profile').update({ headline: 'hackeado' }).eq('id', 1).select('id');
  check(!data || data.length === 0, 'No puede modificar el perfil');
}
{
  const { data, error } = await anon.from('admins').select('*');
  check(!!error || data.length === 0, 'No puede leer la tabla de administradores');
}
{
  const { error } = await anon.from('admins').insert({ user_id: '00000000-0000-0000-0000-000000000000' });
  check(!!error, 'No puede añadirse como administrador');
}
{
  const { data } = await anon.rpc('is_admin');
  check(data === false, 'is_admin() devuelve false');
}
{
  const { error } = await anon.storage.from('article-images').upload(`test/${Date.now()}.txt`, new Blob(['x'], { type: 'image/png' }), { contentType: 'image/png' });
  check(!!error, 'No puede subir imágenes');
}
{
  const { data } = await anon.storage.from('article-images').list('articles');
  check(!data || data.length === 0, 'No puede listar el bucket de imágenes');
}
{
  // Consulta la configuración pública de Auth (no crea usuarios ni envía emails).
  const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
  const settings = res.ok ? await res.json() : {};
  check(settings.disable_signup === true, 'El registro público está desactivado', 'Desactiva «Allow new users to sign up» en Supabase → Authentication → Sign In / Providers');
}

// --------------------------------------------------------------------------
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (email && password) {
  console.log('\nAdministradora');
  const admin = createClient(url, key, opts);
  const { error: loginError } = await admin.auth.signInWithPassword({ email, password });
  check(!loginError, 'Inicia sesión', loginError?.message);
  if (!loginError) {
    const { data: isAdmin } = await admin.rpc('is_admin');
    check(isAdmin === true, 'Figura como administradora', 'Ejecuta el INSERT INTO public.admins del README');

    const slug = `prueba-seguridad-${Date.now()}`;
    const { data: created, error: createError } = await admin.from('articles').insert({ slug, title: 'Prueba de seguridad', status: 'draft' }).select('id').single();
    check(!createError, 'Crea un borrador', createError?.message);

    if (created) {
      const { data: seenByAnon } = await anon.from('articles').select('id').eq('slug', slug);
      check(seenByAnon?.length === 0, 'El borrador no es visible para visitantes');

      const { error: publishError } = await admin.from('articles').update({ status: 'published' }).eq('id', created.id);
      check(!!publishError, 'La base de datos impide publicar un artículo incompleto');

      const { error: updateError } = await admin.from('articles').update({ title: 'Prueba editada' }).eq('id', created.id);
      check(!updateError, 'Edita el borrador', updateError?.message);

      const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0));
      const path = `articles/test/${slug}.png`;
      const { error: upErr } = await admin.storage.from('article-images').upload(path, png, { contentType: 'image/png' });
      check(!upErr, 'Sube una imagen', upErr?.message);
      if (!upErr) {
        const pub = admin.storage.from('article-images').getPublicUrl(path).data.publicUrl;
        const res = await fetch(pub);
        check(res.ok, 'La imagen es accesible públicamente por URL');
        const { error: rmErr } = await admin.storage.from('article-images').remove([path]);
        check(!rmErr, 'Elimina la imagen', rmErr?.message);
      }

      const { error: delError } = await admin.from('articles').delete().eq('id', created.id);
      check(!delError, 'Elimina el borrador', delError?.message);
    }
    await admin.auth.signOut();
  }
} else {
  console.log('\n(Define ADMIN_EMAIL y ADMIN_PASSWORD para probar también el flujo de la administradora.)');
}

console.log(failures === 0 ? '\n\x1b[32mTodo correcto.\x1b[0m\n' : `\n\x1b[31m${failures} comprobación(es) fallida(s).\x1b[0m\n`);
process.exit(failures === 0 ? 0 : 1);

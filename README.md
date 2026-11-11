# Agatha Valladar — Política exterior y relaciones internacionales

Portfolio académico y plataforma editorial con CMS privado.
React + Vite + TypeScript · Supabase (Auth, PostgreSQL, Storage) · Vercel.

- Plan de arquitectura y dirección de arte: [`docs/PLAN.md`](docs/PLAN.md)
- Esquema de base de datos y seguridad: [`supabase/migrations/`](supabase/migrations)

---

## 1. Probar en local (sin configurar nada)

Requisitos: Node 22.18 o superior.

```bash
npm install
npm run dev
```

Abre http://localhost:5173. Sin variables de Supabase la web pública funciona en **modo demostración** con artículos de ejemplo (claramente marcados). El panel `/admin` pedirá configurar Supabase.

---

## 2. Configurar Supabase

### 2.1 Crear el proyecto

1. Entra en [supabase.com](https://supabase.com) → **New project**. Región recomendada: *West EU (Ireland)* o *Central EU (Frankfurt)*.
2. Guarda la contraseña de la base de datos en un lugar seguro (no la necesita la web).

### 2.2 Crear las tablas, la seguridad y el almacenamiento

1. En el proyecto: **SQL Editor → New query**.
2. Copia todo el contenido de [`supabase/migrations/20261111000000_initial_schema.sql`](supabase/migrations/20261111000000_initial_schema.sql) y pulsa **Run**.

Esto crea las tablas, las políticas RLS, el bucket de imágenes `article-images`, las categorías iniciales y los textos de perfil basados en la información facilitada.

*(Opcional)* Para ver la web con artículos de ejemplo, ejecuta también [`supabase/seed.sql`](supabase/seed.sql). Puedes borrarlos después desde el panel.

### 2.3 Desactivar el registro público (importante)

**Authentication → Sign In / Providers → Email**:

- Desactiva **Allow new users to sign up**.
- Mantén activado el proveedor **Email**.

### 2.4 Crear tu usuario administrador

1. **Authentication → Users → Add user → Create new user**.
2. Introduce tu email y una contraseña robusta (12+ caracteres). Marca **Auto Confirm User**.
3. En **SQL Editor**, ejecuta (con tu email):

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'tu-email@ejemplo.com';
```

Solo los usuarios de la tabla `admins` pueden escribir. Aunque alguien lograra crear una cuenta, no podría modificar nada.

*Recomendado:* en **Authentication → URL Configuration** pon como *Site URL* la URL definitiva de la web.

### 2.5 Obtener las claves públicas

**Project Settings → API** (o **Data API / API Keys**):

- **Project URL** → `https://xxxx.supabase.co`
- **anon / publishable key** → clave pública

> ⚠️ Nunca uses la **service_role / secret key** en este proyecto. La web no la necesita en ningún sitio.

### 2.6 Conectar en local

```bash
cp .env.example .env.local
```

Rellena `.env.local` con la URL y la clave pública, y reinicia `npm run dev`. Ya puedes entrar en http://localhost:5173/admin/login.

---

## 3. Desplegar en Vercel

1. Sube el proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repositorio. Vercel detecta Vite automáticamente (`vercel.json` ya define build, rutas, cabeceras de seguridad y funciones).
3. En **Settings → Environment Variables** añade, para *Production* y *Preview*:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (anon) |
| `VITE_SITE_URL` | URL pública definitiva, sin barra final (p. ej. `https://agathavalladar.com`) |
| `SUPABASE_URL` | La misma URL de Supabase |
| `SUPABASE_ANON_KEY` | La misma clave pública |
| `SITE_URL` | La misma URL pública |

Las variables `VITE_*` se incrustan en el frontend al compilar; las otras las usan las funciones de `/api` (metadatos para redes sociales, sitemap y robots). Todas son valores públicos.

4. **Deploy**. Tras cambiar variables, vuelve a desplegar (*Deployments → Redeploy*).
5. *(Dominio propio)* **Settings → Domains** → añade el dominio y sigue las instrucciones DNS. Actualiza `VITE_SITE_URL` / `SITE_URL` y la *Site URL* de Supabase, y redepliega.
6. Da de alta el sitemap en [Google Search Console](https://search.google.com/search-console): `https://tu-dominio/sitemap.xml`.

> Si activas *Deployment Protection* en las previews, las tarjetas de redes sociales solo funcionarán en producción. Es lo esperado.

---

## 4. Verificar la seguridad

Con `.env.local` configurado:

```bash
npm run verify:security
```

Comprueba como visitante anónimo que: no se ven borradores ni programados, no se puede crear/editar/borrar contenido, no se puede subir ni listar imágenes, la tabla `admins` es inaccesible y el registro público está desactivado.

Para probar también el flujo completo de administración (crea un borrador temporal, sube una imagen de prueba y lo elimina todo):

```bash
ADMIN_EMAIL=tu-email@ejemplo.com ADMIN_PASSWORD='tu-contraseña' npm run verify:security
```

Además, en Supabase: **Advisors → Security Advisor** debería no mostrar avisos sobre estas tablas.

---

## 5. Uso del panel

| Acción | Dónde |
|---|---|
| Escribir un artículo | **Nuevo artículo** → título, entradilla, cuerpo (pega desde Word/Docs), imagen principal, categoría → **Publicar** |
| Guardar sin publicar | **Guardar borrador** (no es visible en la web) |
| Programar | Estado *Publicado* + fecha futura → **Programar**. Aparece solo a esa hora |
| Despublicar | En el listado, icono del ojo, o estado *Borrador* en el editor |
| Destacar en portada | Estrella en el listado o casilla en el editor |
| Cambiar fecha/hora | Panel lateral del editor |
| Categorías | **Categorías**: crear, renombrar, reordenar, eliminar (si no tienen artículos) |
| Textos de inicio y «Sobre mí», contacto | **Perfil y web** |

Atajo: **Ctrl/Cmd + S** guarda el artículo. Las imágenes se optimizan automáticamente (WebP, máx. 2400 px) y las sustituidas se borran del almacenamiento.

---

## 6. Estructura del código

```
api/                 Funciones Edge de Vercel: meta OG por artículo, sitemap.xml, robots.txt
supabase/            Migración (esquema + RLS + storage) y seed de demostración
scripts/             Generación de seed / portadas demo, verificación de seguridad
src/
  app/               Router (el CMS se carga bajo demanda)
  styles/            Tokens de diseño y estilos base
  lib/               Utilidades: entorno, fechas, slugs, imágenes, sanitizado, metadatos
  services/          Única capa que habla con Supabase (o con los datos demo)
  hooks/             Hooks de TanStack Query y sesión
  components/        UI, maquetación y componentes editoriales
  pages/             Inicio, Archivo, Artículo, Sobre mí, 404
  admin/             CMS: protección de rutas, listado, editor, imágenes, categorías, perfil
  demo/              Contenido de demostración (fuente del seed)
```

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprobación de tipos + build de producción |
| `npm run preview` | Sirve el build localmente |
| `npm run verify:security` | Verificación RLS / Storage / Auth contra Supabase |
| `npm run seed:generate` | Regenera `supabase/seed.sql` desde `src/demo/content.ts` |
| `npm run covers:generate` | Regenera las portadas abstractas de demostración |

### Retirar el contenido de demostración

Cuando publiques tus artículos reales:

```sql
delete from public.articles where cover_image->>'path' like '/demo/%';
```

Las portadas de `public/demo/` pueden borrarse entonces del repositorio.

# Agatha Valladar — Plan de arquitectura y dirección de arte

Documento de las fases 1 (planificación) y 2 (diseño). Recoge las decisiones tomadas y su justificación.

---

## 1. Análisis de requisitos

La web tiene dos públicos y dos modos de uso muy distintos:

| Público | Necesita | Prioridad |
|---|---|---|
| Lectores, colegas, editores, periodistas | Entender en segundos quién es Agatha y sobre qué investiga; leer con comodidad; compartir artículos | Calidad visual, lectura, SEO, rendimiento |
| Agatha (única administradora) | Publicar sin tocar código: pegar un texto, subir imágenes, pulsar «Publicar» | Sencillez, feedback, seguridad |

De ahí salen tres principios que guían todo lo demás:

1. **La lectura manda.** Cada decisión visual se mide por si ayuda o estorba a leer un análisis de 2.000 palabras.
2. **Publicar en un minuto.** El editor reproduce el gesto natural (escribir en Word/Docs → copiar → pegar → publicar).
3. **Seguro por defecto.** La seguridad reside en la base de datos (RLS), no en ocultar botones en el frontend.

---

## 2. Arquitectura técnica

Se mantiene la arquitectura propuesta, porque encaja: es barata (planes gratuitos de Supabase y Vercel cubren holgadamente una web personal), sencilla de mantener y sin servidores propios.

```
┌──────────────────────────── Vercel ────────────────────────────┐
│                                                                 │
│  SPA estática (React + Vite + TS)        Funciones Edge         │
│  ├─ Web pública (/, /publicaciones…)     ├─ /publicaciones/:slug│
│  └─ CMS (/admin, carga diferida)         │   → HTML con meta OG │
│                                          └─ /sitemap.xml        │
└───────────────┬────────────────────────────────┬────────────────┘
                │ supabase-js (clave pública)     │ REST (clave pública)
┌───────────────▼────────────────────────────────▼────────────────┐
│ Supabase                                                         │
│  Auth (email + contraseña, registro desactivado)                 │
│  PostgreSQL + RLS  → articles · categories · site_profile · admins│
│  Storage           → bucket público «article-images»             │
└──────────────────────────────────────────────────────────────────┘
```

### Decisiones con criterio propio

**SPA + funciones Edge en lugar de migrar a Next.js.**
El punto débil de una SPA de Vite es que LinkedIn y X no ejecutan JavaScript: si se comparte un artículo verían el título genérico de la web. En lugar de cambiar de framework, una función Edge intercepta `/publicaciones/:slug`, consulta el artículo y devuelve el mismo `index.html` con título, descripción, Open Graph, Twitter Card, URL canónica y JSON-LD del artículo ya inyectados. Coste: unas 100 líneas. Google, LinkedIn y X ven metadatos correctos; el usuario recibe la SPA de siempre.

**Publicación programada sin cron.**
Un artículo «publicado» con fecha futura es, de hecho, un artículo programado. La política RLS solo deja ver artículos `status = 'published' AND published_at <= now()`. No hace falta ningún proceso en segundo plano: llegado el momento, el artículo aparece solo.

**Ninguna clave privada en ningún sitio.**
Ni el frontend ni las funciones de Vercel usan la `service_role key`. Todo funciona con la clave pública (anon), y es la base de datos quien decide qué puede hacer cada petición. Las funciones Edge solo leen contenido público.

**Doble cerrojo para el acceso administrativo.**
1. El registro público se desactiva en Supabase Auth.
2. Aunque alguien consiguiera crear una cuenta, no podría escribir nada: las políticas exigen que el usuario figure en la tabla `admins`, que no es accesible desde la API.

**Imágenes optimizadas en el navegador.**
La transformación de imágenes de Supabase es de pago. Antes de subir, el CMS redimensiona (máx. 2400 px) y convierte a WebP en el propio navegador: una foto de móvil de 6 MB queda en ~300 KB sin que Agatha tenga que hacer nada. Se guardan ancho y alto para evitar saltos de maquetación (CLS).

**Búsqueda a texto completo en español.**
Columna `tsvector` generada con diccionario español y sin acentos (`unaccent`): buscar «union europea» encuentra «Unión Europea», y «sanciones» encuentra «sanción». Ponderación: título > entradilla > cuerpo.

**Contenido de «Sobre mí» editable desde el CMS.**
El encargo pide gestionar «toda la web sin tocar código». Además de artículos y categorías, el panel incluye una sección «Perfil y web» para editar la presentación, el perfil investigador, la vinculación con el Instituto Franklin, la trayectoria, las líneas de investigación y los datos de contacto. Las secciones vacías no se muestran en la web pública: nada de textos de relleno ni datos inventados.

**Modo demostración.**
Sin variables de Supabase configuradas, la web pública funciona con contenido de demostración local. Permite ver el diseño desde el primer `npm run dev`. El contenido de demostración y el `seed.sql` salen de la misma fuente (`src/demo/content.ts`).

### Stack

| Capa | Tecnología | Motivo |
|---|---|---|
| UI | React 19 + TypeScript | Requisito; tipado de extremo a extremo |
| Build | Vite | Requisito; build rápido |
| Rutas | React Router (data router) | Carga diferida del CMS, aviso de cambios sin guardar |
| Datos | TanStack Query | Caché, navegación sin recargas, estados de carga/error coherentes |
| Editor | Tiptap (ProseMirror) | Pegado limpio desde Word/Docs, salida HTML semántica, sin Markdown |
| Validación | Zod | Mismas reglas en formulario y servicios |
| Sanitizado | DOMPurify | Defensa en profundidad al renderizar HTML |
| Estilos | CSS moderno + CSS Modules + variables | Sin dependencias, sin aspecto de framework |
| Iconos | Font Awesome (SVG, importación individual) | Requisito; solo se empaquetan los iconos usados |
| Tipografía | Inter (Google Fonts, eje óptico `opsz`) | Requisito |

### Organización del código

```
api/                      Funciones Edge de Vercel (meta OG, sitemap)
supabase/
  migrations/             Esquema, RLS, storage
  seed.sql                Artículos de demostración (opcional)
scripts/                  Generación de seed y verificación de seguridad
src/
  app/                    Router, proveedores
  styles/                 Tokens y estilos globales
  lib/                    Utilidades puras (fechas, slugs, imágenes, entorno)
  services/               Acceso a datos (Supabase / demo) — única capa que conoce Supabase
  hooks/                  Hooks de TanStack Query sobre los servicios
  components/             Componentes reutilizables (ui, layout, articles)
  pages/                  Páginas públicas
  admin/                  CMS (carga diferida, no entra en el bundle público)
  demo/                   Contenido de demostración
```

Separación: **páginas → hooks → servicios → Supabase**. Ningún componente importa `supabase` directamente.

---

## 3. Estructura de páginas

| Ruta | Página | Notas |
|---|---|---|
| `/` | Inicio | Cabecera, declaración de investigación, destacados, recientes, líneas, presentación |
| `/publicaciones` | Archivo | Búsqueda, filtro por categoría, paginación; estado en la URL (`?q=&categoria=&pagina=`) para poder compartir búsquedas |
| `/publicaciones/:slug` | Artículo | URL permanente; meta inyectada en servidor |
| `/sobre-mi` | Sobre mí | Contenido editable desde el CMS |
| `/admin/login` | Acceso | Sin enlace público, `noindex`, bloqueado en robots.txt |
| `/admin` | Listado de artículos | Filtros por estado y categoría, búsqueda |
| `/admin/articulos/nuevo` · `/admin/articulos/:id` | Editor | |
| `/admin/categorias` | Categorías | Crear, renombrar, reordenar, eliminar |
| `/admin/perfil` | Perfil y web | Textos de inicio y «Sobre mí», contacto |

---

## 4. Modelo de datos (Supabase)

```
admins          user_id (PK → auth.users)                     sin acceso por API
categories      id, name, slug (único), description, sort_order
articles        id, slug (único), title, excerpt, body (HTML),
                cover_image (jsonb), secondary_image (jsonb),
                category_id (→ categories, RESTRICT), status (draft|published),
                featured, published_at, seo_title, seo_description,
                search (tsvector generado), created_at, updated_at
site_profile    fila única (id = 1): titular, textos de inicio,
                secciones de «Sobre mí», líneas de investigación (jsonb), contacto
```

Imagen (`jsonb`): `{ path, alt, caption?, width, height }`. El texto alternativo es obligatorio.

Restricción en base de datos: un artículo publicado debe tener imagen principal, categoría y entradilla. Aunque se saltara el formulario, la base de datos lo impide.

### Políticas RLS

| Tabla | Lectura | Escritura |
|---|---|---|
| `articles` | Pública si `published` y `published_at <= now()`; todo si `is_admin()` | Solo `is_admin()` |
| `categories` | Pública | Solo `is_admin()` |
| `site_profile` | Pública | Solo `is_admin()` |
| `admins` | Nadie (solo la función `is_admin()`, `security definer`) | Nadie (se gestiona por SQL) |
| `storage: article-images` | Pública (URL directa) | Solo `is_admin()` |

---

## 5. Cómo funciona el CMS

1. Agatha entra en `/admin/login` con su email y contraseña.
2. Ve la lista de artículos con su estado (Publicado · Programado · Borrador), categoría y fecha. Puede buscar y filtrar.
3. «Nuevo artículo» abre el editor:
   - **Columna principal:** título, entradilla y cuerpo. El cuerpo es un editor visual: pegar desde Word o Google Docs conserva párrafos, encabezados, negritas, cursivas, enlaces y listas, y descarta estilos ajenos.
   - **Panel lateral:** estado, fecha y hora, categoría, destacado, imágenes (arrastrar o elegir, previsualizar, sustituir, quitar, texto alternativo y pie), URL y SEO opcional.
4. «Guardar borrador» o «Publicar». Si la fecha es futura, el botón dice «Programar» y el artículo se publicará solo.
5. Feedback inmediato: avisos de guardado, errores en lenguaje claro junto al campo y aviso si se intenta salir con cambios sin guardar.
6. Las imágenes se suben al guardar (nunca quedan huérfanas) y las sustituidas se borran del almacenamiento.

---

## 6. Dirección de arte

### Concepto: «la página de análisis»

La referencia no es un blog, sino la primera página de una revista de análisis internacional o la portada de un think tank europeo: una cabecera con nombre, filetes finos que ordenan, una retícula visible a través de la alineación, titulares con peso y mucho aire. La identidad no está en un logotipo sino en la **composición**: el nombre como cabecera, secciones numeradas, una sola tinta de acento y el ritmo de los filetes.

### Sistema gráfico

- **Cabecera tipográfica.** «AGATHA VALLADAR» en Inter 600, mayúsculas, interletraje amplio (0,2em). Funciona como marca sin necesidad de logotipo; el monograma «AV» se usa solo en el favicon.
- **Filetes.** Línea de 1 px en tinta para abrir secciones; línea de 1 px en gris cálido para separar elementos. Ningún recuadro ni tarjeta con sombra.
- **Secciones numeradas.** «01 Destacados», «02 Recientes»… Etiquetas pequeñas en mayúsculas con cifras tabulares, como en un índice de revista.
- **Retícula de 12 columnas**, ancho máximo 1240 px, márgenes fluidos.
- **Columna de lectura** de ~68 caracteres por línea; las imágenes del artículo la desbordan ligeramente para dar respiración.

### Paleta

| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#FFFFFF` | Fondo blanco |
| `--color-surface` | `#FFFFFF` | Superficies del CMS, campos |
| `--color-ink` | `#1A1B1E` | Titulares, filetes fuertes |
| `--color-text` | `#2B2D31` | Texto de lectura |
| `--color-muted` | `#62656B` | Metadatos, entradillas secundarias |
| `--color-subtle` | `#76797F` | Información terciaria, marcadores de posición |
| `--color-rule` | `#E4E4E7` | Filetes finos |
| `--color-accent` | `#14452F` | **Verde botella**: categorías, enlaces, cifras de sección, detalles |
| `--color-deep` | `#0D261C` | Verde casi negro: pie de página y bloques premium |
| `--color-accent-strong` | `#0C2E1F` | Hover |
| `--color-accent-soft` | `#E5EEE8` | Selección de texto, fondos de estado |

El azul petróleo se eligió frente al marino (demasiado corporativo) y al verde (asociado a sostenibilidad): evoca el Atlántico, que es literalmente el objeto de estudio, y tiene la sobriedad de la tinta de imprenta. Se usa en menos del 5 % de la superficie.

Contrastes comprobados sobre el fondo (WCAG AA): texto `#2B2D31` 12,5:1; metadatos `#62656B` 5,3:1; acento `#1D4B5A` 8,7:1; terciario `#76797F` 4:1 (solo textos auxiliares).

### Tipografía (solo Inter)

| Nivel | Tamaño | Peso | Interlineado | Interletraje |
|---|---|---|---|---|
| Nombre (cabecera) | 15 px | 600 | 1 | +0,2em, mayúsculas |
| Declaración de portada | 36 → 68 px fluido | 450 | 1,08 | −0,03em |
| Titular de artículo (H1) | 34 → 56 px fluido | 600 | 1,08 | −0,025em |
| Título en listados | 20 → 24 px | 600 | 1,25 | −0,015em |
| Entradilla | 19 → 22 px | 400 | 1,5 | −0,005em |
| Texto de lectura | 18 px | 400 | 1,75 | 0 |
| Subtítulos de artículo | 24 / 20 px | 600 | 1,3 | −0,015em |
| Navegación | 14 px | 500 | 1 | +0,01em |
| Metadatos y fechas | 13 px | 500 | 1,4 | +0,06em, mayúsculas, cifras tabulares |

Se aprovecha el eje óptico de Inter (`opsz`): los titulares grandes se dibujan con la variante «display», más compacta, y el texto corrido con la variante de lectura.

### Microinteracciones

- Subrayado que crece desde la izquierda en enlaces de navegación.
- Títulos de artículo que cambian a acento al pasar el cursor; imágenes con un leve zoom (1,02) y transición de 400 ms.
- Barra de progreso de lectura de 2 px en el artículo.
- Aparición suave (fade + 8 px) del contenido al cambiar de página.
- Todo se desactiva con `prefers-reduced-motion`.

### Lo que se evita deliberadamente

Gradientes, sombras de tarjeta, esquinas muy redondeadas (máx. 4 px; 8 px solo en algún contenedor del CMS), iconos decorativos, contadores de vistas, nubes de etiquetas, carruseles, «hero» con foto a pantalla completa y cualquier elemento que no ayude a leer o a encontrar un artículo.

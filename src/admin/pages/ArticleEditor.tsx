import { faArrowLeft, faArrowUpRightFromSquare, faCircle, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Icon } from '@/components/ui/Icon';
import { PageLoader } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { queryKeys, useAdminArticle, useCategories } from '@/hooks/queries';
import { formatDateTime, fromLocalInputValue, toLocalInputValue } from '@/lib/format';
import { slugify } from '@/lib/slug';
import { articlePath } from '@/lib/site';
import { deleteArticle, isSlugTaken, saveArticle } from '@/services/articles';
import { toAppError } from '@/services/errors';
import { deleteImages } from '@/services/storage';
import type { Article, ArticleInput, ArticleStatus } from '@/types/content';
import { ImageField } from '../components/ImageField';
import { RichTextEditor } from '../components/RichTextEditor';
import { StatusBadge } from '../components/StatusBadge';
import {
  emptyForm,
  formFromArticle,
  LIMITS,
  snapshot,
  validate,
  type ArticleFormState,
  type FieldErrors,
} from '../articleForm';
import { resolveDraft } from '../imageDraft';
import styles from '../admin.module.css';

function Counter({ value, max }: { value: string; max: number }) {
  return <span className={`${styles.fieldCount} ${value.length > max ? styles.fieldCountOver : ''}`}>{value.length}/{max}</span>;
}

export default function ArticleEditor() {
  const { id } = useParams();
  const query = useAdminArticle(id);

  if (id && query.isPending) return <PageLoader />;
  if (id && query.isError) return <div className={styles.page}><ErrorState error={query.error} onRetry={() => query.refetch()} /></div>;
  if (id && !query.data) {
    return (
      <div className={styles.centerBox}>
        <div>
          <h1>Artículo no encontrado</h1>
          <p>Puede que se haya eliminado. <Link to="/admin">Volver al listado</Link></p>
        </div>
      </div>
    );
  }
  // `key` reinicia el formulario al cambiar de artículo.
  return <EditorForm key={id ?? 'new'} article={query.data ?? null} />;
}

function EditorForm({ article }: { article: Article | null }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const categories = useCategories();

  const initial = useMemo(() => (article ? formFromArticle(article) : emptyForm()), [article]);
  const [form, setForm] = useState<ArticleFormState>(initial);
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshot(initial));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const allowNavigation = useRef(false);

  const isDirty = snapshot(form) !== savedSnapshot;
  const wasPublished = article?.status === 'published';
  const isFuture = new Date(form.publishedAt) > new Date();

  useEffect(() => {
    document.title = `${article ? 'Editar' : 'Nuevo'} artículo — Panel`;
  }, [article]);

  // Aviso al salir con cambios sin guardar.
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    !allowNavigation.current && isDirty && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const update = useCallback(<K extends keyof ArticleFormState>(key: K, value: ArticleFormState[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      // La URL se genera a partir del título hasta que se edita a mano.
      if (key === 'title' && !f.slugTouched) next.slug = slugify(value as string);
      return next;
    });
    setErrors((e) => (e[key as keyof FieldErrors] ? { ...e, [key]: undefined } : e));
  }, []);

  async function save(targetStatus: ArticleStatus) {
    let next: ArticleFormState = { ...form, status: targetStatus };
    // Al publicar por primera vez sin haber tocado la fecha, se usa la hora actual.
    if (targetStatus === 'published' && !wasPublished && !form.dateTouched && !isFuture) {
      next = { ...next, publishedAt: toLocalInputValue(new Date().toISOString()) };
    }
    if (!next.slug) next.slug = slugify(next.title);

    const v = validate(next);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      toast.error('Revisa los campos marcados antes de guardar.');
      document.querySelector('[aria-invalid="true"], [data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);
    const uploaded: string[] = [];
    try {
      if (await isSlugTaken(next.slug, article?.id)) {
        setErrors({ slug: 'Ya existe otro artículo con esta URL.' });
        toast.error('La URL ya está en uso. Cámbiala para continuar.');
        return;
      }

      // La principal en JPEG: es la que muestran LinkedIn, X o WhatsApp al compartir.
      const cover = await resolveDraft(next.cover, 'jpeg');
      if (next.cover?.file && cover) uploaded.push(cover.path);
      const secondary = await resolveDraft(next.secondary);
      if (next.secondary?.file && secondary) uploaded.push(secondary.path);

      const input: ArticleInput = {
        title: next.title.trim(),
        slug: next.slug,
        excerpt: next.excerpt.trim(),
        body: next.body,
        cover_image: cover,
        secondary_image: secondary,
        category_id: next.categoryId || null,
        status: next.status,
        featured: next.featured,
        published_at: fromLocalInputValue(next.publishedAt),
        seo_title: next.seoTitle.trim() || null,
        seo_description: next.seoDescription.trim() || null,
      };

      const saved = await saveArticle(input, article?.id);

      // Borra del almacenamiento las imágenes sustituidas o quitadas.
      const stillUsed = new Set([saved.cover_image?.path, saved.secondary_image?.path]);
      await deleteImages([article?.cover_image?.path, article?.secondary_image?.path].filter((p) => p && !stillUsed.has(p)));

      const savedForm = formFromArticle(saved);
      setForm(savedForm);
      setSavedSnapshot(snapshot(savedForm));
      setLastSavedAt(new Date());
      setErrors({});
      qc.setQueryData(queryKeys.adminArticle(saved.id), saved);
      qc.invalidateQueries({ queryKey: queryKeys.articles, predicate: (q) => q.queryKey[2] !== saved.id });

      const scheduled = saved.status === 'published' && new Date(saved.published_at) > new Date();
      toast.success(
        saved.status === 'draft'
          ? 'Borrador guardado.'
          : scheduled
            ? `Programado para el ${formatDateTime(saved.published_at)}.`
            : wasPublished
              ? 'Cambios publicados.'
              : 'Artículo publicado.',
      );

      if (!article) {
        allowNavigation.current = true;
        navigate(`/admin/articulos/${saved.id}`, { replace: true });
      }
    } catch (err) {
      await deleteImages(uploaded);
      const e = toAppError(err);
      if (e.code === '23505') setErrors({ slug: 'Ya existe otro artículo con esta URL.' });
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!article) return;
    setDeleting(true);
    try {
      const deleted = await deleteArticle(article.id);
      await deleteImages([deleted?.cover_image?.path, deleted?.secondary_image?.path]);
      toast.success('Artículo eliminado.');
      qc.invalidateQueries({ queryKey: queryKeys.articles });
      allowNavigation.current = true;
      navigate('/admin', { replace: true });
    } catch (err) {
      toast.error(toAppError(err).message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  // Guardar con Ctrl/Cmd + S.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!saving) saveRef.current(form.status);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [form.status, saving]);

  const primaryLabel =
    form.status === 'draft' ? 'Guardar borrador' : isFuture ? 'Programar' : wasPublished ? 'Guardar cambios' : 'Publicar';
  const publicUrl = articlePath(form.slug || 'url-del-articulo');
  const coverAltError = form.cover && errors.cover ? errors.cover : undefined;
  const secondaryAltError = form.secondary && errors.secondary ? errors.secondary : undefined;

  return (
    <>
      <div className={styles.editorTopbar}>
        <div className={styles.topbarLeft}>
          <Link to="/admin" className={styles.backLink}>
            <Icon icon={faArrowLeft} /> Artículos
          </Link>
          {article && <StatusBadge article={article} />}
          <span className={`${styles.saveState} ${isDirty ? styles.saveStateDirty : ''}`} aria-live="polite">
            {saving ? (
              'Guardando…'
            ) : isDirty ? (
              <><Icon icon={faCircle} style={{ fontSize: '0.4rem' }} /> Cambios sin guardar</>
            ) : lastSavedAt ? (
              <><Icon icon={faCheck} /> Guardado</>
            ) : null}
          </span>
        </div>
        <div className={styles.topbarActions}>
          {article && wasPublished && !isDirty && (
            <a href={articlePath(article.slug)} target="_blank" rel="noopener" className={styles.iconButton} title="Ver en la web" aria-label="Ver en la web">
              <Icon icon={faArrowUpRightFromSquare} />
            </a>
          )}
          {form.status === 'draft' ? (
            <>
              <Button size="sm" onClick={() => save('draft')} loading={saving} disabled={saving}>Guardar borrador</Button>
              <Button size="sm" variant="primary" onClick={() => save('published')} disabled={saving}>
                {isFuture ? 'Programar' : 'Publicar'}
              </Button>
            </>
          ) : (
            <Button size="sm" variant="primary" onClick={() => save('published')} loading={saving}>{primaryLabel}</Button>
          )}
        </div>
      </div>

      <form className={styles.editorGrid} onSubmit={(e) => { e.preventDefault(); save(form.status); }} noValidate>
        {/* Columna principal ------------------------------------------------ */}
        <div className={styles.editorMain}>
          <div className={styles.field}>
            <label htmlFor="title" className="visually-hidden">Título</label>
            <textarea
              id="title"
              rows={1}
              className={styles.titleInput}
              placeholder="Título del artículo"
              value={form.title}
              onChange={(e) => update('title', e.target.value.replace(/\n/g, ' '))}
              aria-invalid={!!errors.title}
              maxLength={LIMITS.title + 20}
            />
            {errors.title && <p className={styles.fieldError}>{errors.title}</p>}
          </div>

          <div className={styles.field}>
            <label htmlFor="excerpt" className={styles.fieldLabel}>
              Entradilla <Counter value={form.excerpt} max={LIMITS.excerpt} />
            </label>
            <textarea
              id="excerpt"
              rows={2}
              className={styles.excerptInput}
              placeholder="Resumen de dos o tres líneas que aparece bajo el título y en los listados."
              value={form.excerpt}
              onChange={(e) => update('excerpt', e.target.value)}
              aria-invalid={!!errors.excerpt}
            />
            {errors.excerpt && <p className={styles.fieldError}>{errors.excerpt}</p>}
          </div>

          <div className={styles.field} data-invalid={!!errors.body || undefined}>
            <label htmlFor="body" className={styles.fieldLabel}>Cuerpo del artículo</label>
            <RichTextEditor id="body" value={form.body} onChange={(html) => update('body', html)} invalid={!!errors.body} />
            {errors.body && <p className={styles.fieldError}>{errors.body}</p>}
          </div>
        </div>

        {/* Panel lateral ---------------------------------------------------- */}
        <aside className={styles.sidebarPanels} aria-label="Ajustes de publicación">
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Publicación</h2>
            <div className={styles.segmented} role="radiogroup" aria-label="Estado">
              <label>
                <input type="radio" name="status" value="draft" checked={form.status === 'draft'} onChange={() => update('status', 'draft')} />
                <span>Borrador</span>
              </label>
              <label>
                <input type="radio" name="status" value="published" checked={form.status === 'published'} onChange={() => update('status', 'published')} />
                <span>Publicado</span>
              </label>
            </div>
            <div className={styles.field}>
              <label htmlFor="published-at" className={styles.fieldLabel}>Fecha y hora de publicación</label>
              <input
                id="published-at"
                type="datetime-local"
                className={`${styles.input} ${errors.publishedAt ? styles.invalid : ''}`}
                value={form.publishedAt}
                onChange={(e) => { update('publishedAt', e.target.value); update('dateTouched', true); }}
                aria-invalid={!!errors.publishedAt}
              />
              {errors.publishedAt && <p className={styles.fieldError}>{errors.publishedAt}</p>}
            </div>
            {form.status === 'published' && isFuture && (
              <p className={styles.notice}>
                Programado: se publicará automáticamente el {formatDateTime(fromLocalInputValue(form.publishedAt))}.
              </p>
            )}
            {form.status === 'draft' && <p className={styles.fieldHint}>Los borradores no son visibles en la web.</p>}
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} />
              <span>
                Destacar en la portada
                <span className={styles.fieldHint} style={{ display: 'block' }}>Aparece en «Destacados» de la página de inicio.</span>
              </span>
            </label>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Categoría</h2>
            <div className={styles.field}>
              <label htmlFor="category" className="visually-hidden">Categoría</label>
              <select
                id="category"
                className={`${styles.select} ${errors.categoryId ? styles.invalid : ''}`}
                value={form.categoryId}
                onChange={(e) => update('categoryId', e.target.value)}
                aria-invalid={!!errors.categoryId}
              >
                <option value="">Sin categoría</option>
                {(categories.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className={styles.fieldError}>{errors.categoryId}</p>}
              <p className={styles.fieldHint}><Link to="/admin/categorias" style={{ textDecoration: 'underline' }}>Gestionar categorías</Link></p>
            </div>
          </section>

          <section className={styles.panel} data-invalid={!!errors.cover || undefined}>
            <h2 className={styles.panelTitle}>Imágenes</h2>
            <ImageField
              label="Imagen principal"
              hint="Se muestra en la cabecera del artículo, los listados y al compartir en redes. Proporción recomendada 3:2."
              value={form.cover}
              onChange={(v) => update('cover', v)}
              error={coverAltError ? undefined : errors.cover}
              altError={coverAltError}
            />
            <ImageField
              label="Imagen secundaria (opcional)"
              hint="Se intercala a mitad del texto."
              value={form.secondary}
              onChange={(v) => update('secondary', v)}
              altError={secondaryAltError}
            />
          </section>

          <section className={styles.panel}>
            <details className={styles.details} open={!!errors.slug || !!errors.seoTitle || !!errors.seoDescription || undefined}>
              <summary>URL y SEO <span aria-hidden>+</span></summary>
              <div className={styles.detailsBody}>
                <div className={styles.field}>
                  <label htmlFor="slug" className={styles.fieldLabel}>URL del artículo</label>
                  <input
                    id="slug"
                    className={`${styles.input} ${errors.slug ? styles.invalid : ''}`}
                    value={form.slug}
                    onChange={(e) => { update('slug', e.target.value.toLowerCase().replace(/\s+/g, '-')); update('slugTouched', true); }}
                    onBlur={() => update('slug', slugify(form.slug) || slugify(form.title))}
                    aria-invalid={!!errors.slug}
                  />
                  {errors.slug ? <p className={styles.fieldError}>{errors.slug}</p> : <p className={styles.slugPreview}>{publicUrl}</p>}
                  {wasPublished && article && form.slug !== article.slug && (
                    <p className={styles.notice}>Cambiar la URL de un artículo publicado rompe los enlaces que ya se hayan compartido.</p>
                  )}
                </div>
                <div className={styles.field}>
                  <label htmlFor="seo-title" className={styles.fieldLabel}>
                    Título SEO <Counter value={form.seoTitle} max={LIMITS.seoTitle} />
                  </label>
                  <input id="seo-title" className={styles.input} value={form.seoTitle} placeholder={form.title || 'Por defecto, el título'} onChange={(e) => update('seoTitle', e.target.value)} />
                  {errors.seoTitle && <p className={styles.fieldError}>{errors.seoTitle}</p>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="seo-description" className={styles.fieldLabel}>
                    Meta descripción <Counter value={form.seoDescription} max={LIMITS.seoDescription} />
                  </label>
                  <textarea id="seo-description" rows={3} className={styles.textarea} value={form.seoDescription} placeholder="Por defecto, la entradilla" onChange={(e) => update('seoDescription', e.target.value)} />
                  {errors.seoDescription && <p className={styles.fieldError}>{errors.seoDescription}</p>}
                  <p className={styles.fieldHint}>Opcional. Texto que muestran Google y las redes sociales.</p>
                </div>
              </div>
            </details>
          </section>

          {article && (
            <section className={`${styles.panel} ${styles.dangerZone}`}>
              <h2 className={styles.panelTitle}>Eliminar</h2>
              <p className={styles.fieldHint}>Elimina el artículo y sus imágenes de forma permanente.</p>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} style={{ color: 'var(--color-danger)', justifySelf: 'start' }}>
                Eliminar artículo
              </Button>
            </section>
          )}
        </aside>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar este artículo?"
        confirmLabel="Eliminar definitivamente"
        danger
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      >
        <p>Esta acción no se puede deshacer. Si solo quieres ocultarlo, cámbialo a borrador.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Tienes cambios sin guardar"
        confirmLabel="Salir sin guardar"
        danger
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      >
        <p>Si sales ahora, perderás los cambios realizados desde el último guardado.</p>
      </ConfirmDialog>
    </>
  );
}

import { faArrowUpRightFromSquare, faEye, faEyeSlash, faMagnifyingGlass, faPen, faPlus, faStar as faStarSolid, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { faStar } from '@fortawesome/free-regular-svg-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Icon } from '@/components/ui/Icon';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { queryKeys, useAdminArticles, useCategories } from '@/hooks/queries';
import { formatDateShort, formatTime } from '@/lib/format';
import { imageUrl } from '@/lib/images';
import { normalizeSearch } from '@/lib/slug';
import { articlePath } from '@/lib/site';
import { deleteArticle, displayStatus, setArticleFields } from '@/services/articles';
import { deleteImages } from '@/services/storage';
import type { ArticleDisplayStatus, ArticleSummary } from '@/types/content';
import { StatusBadge } from '../components/StatusBadge';
import styles from '../admin.module.css';

type Filter = ArticleDisplayStatus | 'all';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'published', label: 'Publicados' },
  { key: 'scheduled', label: 'Programados' },
  { key: 'draft', label: 'Borradores' },
];

export default function ArticlesList() {
  const toast = useToast();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const status = (params.get('estado') as Filter) || 'all';
  const categoryId = params.get('categoria') || 'all';
  const [query, setQuery] = useState('');
  const [toDelete, setToDelete] = useState<ArticleSummary | null>(null);

  const articles = useAdminArticles();
  const categories = useCategories();

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const counts = useMemo(() => {
    const c = { all: 0, published: 0, scheduled: 0, draft: 0 } as Record<Filter, number>;
    for (const a of articles.data ?? []) {
      c.all++;
      c[displayStatus(a)]++;
    }
    return c;
  }, [articles.data]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(query).toLowerCase();
    return (articles.data ?? []).filter(
      (a) =>
        (status === 'all' || displayStatus(a) === status) &&
        (categoryId === 'all' || a.category_id === categoryId) &&
        (!q || normalizeSearch(`${a.title} ${a.excerpt} ${a.slug}`).toLowerCase().includes(q)),
    );
  }, [articles.data, status, categoryId, query]);

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.articles });

  const toggleFeatured = useMutation({
    mutationFn: (a: ArticleSummary) => setArticleFields(a.id, { featured: !a.featured }),
    onSuccess: (_d, a) => {
      toast.success(a.featured ? 'Artículo quitado de destacados.' : 'Artículo marcado como destacado.');
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: (a: ArticleSummary) => setArticleFields(a.id, { status: a.status === 'published' ? 'draft' : 'published' }),
    onSuccess: (_d, a) => {
      toast.success(a.status === 'published' ? 'Artículo despublicado: ahora es un borrador.' : 'Artículo publicado.');
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (a: ArticleSummary) => {
      const deleted = await deleteArticle(a.id);
      await deleteImages([deleted?.cover_image?.path, deleted?.secondary_image?.path]);
    },
    onSuccess: () => {
      toast.success('Artículo eliminado.');
      setToDelete(null);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Artículos</h1>
          <p className={styles.pageSubtitle}>Gestiona, publica y organiza tus publicaciones.</p>
        </div>
        <ButtonLink to="/admin/articulos/nuevo" variant="primary">
          <Icon icon={faPlus} /> Nuevo artículo
        </ButtonLink>
      </header>

      <div className={styles.stats} role="group" aria-label="Filtrar por estado">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${styles.statButton} ${status === f.key ? styles.statButtonActive : ''}`}
            onClick={() => setParam('estado', f.key)}
            aria-pressed={status === f.key}
          >
            {f.label} <span className={styles.statCount}>{counts[f.key]}</span>
          </button>
        ))}
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.searchWrap}>
          <Icon icon={faMagnifyingGlass} />
          <label htmlFor="admin-search" className="visually-hidden">Buscar artículos</label>
          <input id="admin-search" type="search" className={styles.input} placeholder="Buscar por título, entradilla o URL" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <label htmlFor="admin-cat" className="visually-hidden">Filtrar por categoría</label>
        <select id="admin-cat" className={styles.select} value={categoryId} onChange={(e) => setParam('categoria', e.target.value)}>
          <option value="all">Todas las categorías</option>
          {(categories.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {articles.isPending ? (
        <PageLoader />
      ) : articles.isError ? (
        <ErrorState error={articles.error} onRetry={() => articles.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState title={counts.all === 0 ? 'Aún no has creado ningún artículo.' : 'Ningún artículo coincide con los filtros.'}>
          {counts.all === 0 && <p><Link to="/admin/articulos/nuevo" className={styles.titleLink}>Escribe el primero →</Link></p>}
        </EmptyState>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Título</th>
              <th scope="col">Categoría</th>
              <th scope="col">Estado</th>
              <th scope="col">Publicación</th>
              <th scope="col"><span className="visually-hidden">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const thumb = imageUrl(a.cover_image);
              const s = displayStatus(a);
              return (
                <tr key={a.id}>
                  <td>
                    <div className={styles.cellTitle}>
                      {thumb ? <img src={thumb} alt="" className={styles.thumb} loading="lazy" /> : <span className={styles.thumb} />}
                      <div>
                        <Link to={`/admin/articulos/${a.id}`} className={styles.titleLink}>{a.title}</Link>
                        <p className={styles.slug}>/{a.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`${styles.muted} ${styles.hideMobile}`}>{a.category?.name ?? '—'}</td>
                  <td><StatusBadge article={a} /></td>
                  <td className={`${styles.nowrap} ${styles.muted}`}>
                    {formatDateShort(a.published_at)} · {formatTime(a.published_at)}
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={`${styles.iconButton} ${a.featured ? styles.starOn : ''}`}
                        onClick={() => toggleFeatured.mutate(a)}
                        aria-label={a.featured ? 'Quitar de destacados' : 'Marcar como destacado'}
                        title={a.featured ? 'Destacado' : 'Destacar'}
                        aria-pressed={a.featured}
                      >
                        <Icon icon={a.featured ? faStarSolid : faStar} />
                      </button>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => toggleStatus.mutate(a)}
                        disabled={a.status === 'draft' && (!a.cover_image || !a.category_id || !a.excerpt)}
                        title={a.status === 'published' ? 'Despublicar (pasar a borrador)' : a.cover_image && a.category_id && a.excerpt ? 'Publicar' : 'Completa imagen, categoría y entradilla para publicar'}
                        aria-label={a.status === 'published' ? 'Despublicar' : 'Publicar'}
                      >
                        <Icon icon={a.status === 'published' ? faEyeSlash : faEye} />
                      </button>
                      {s === 'published' && (
                        <a href={articlePath(a.slug)} target="_blank" rel="noopener" className={styles.iconButton} aria-label="Ver en la web" title="Ver en la web">
                          <Icon icon={faArrowUpRightFromSquare} />
                        </a>
                      )}
                      <Link to={`/admin/articulos/${a.id}`} className={styles.iconButton} aria-label="Editar" title="Editar">
                        <Icon icon={faPen} />
                      </Link>
                      <button type="button" className={`${styles.iconButton} ${styles.dangerIcon}`} onClick={() => setToDelete(a)} aria-label="Eliminar" title="Eliminar">
                        <Icon icon={faTrashCan} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="¿Eliminar este artículo?"
        confirmLabel="Eliminar definitivamente"
        danger
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      >
        <p>«{toDelete?.title}» y sus imágenes se eliminarán de forma permanente. Si solo quieres ocultarlo, despublícalo.</p>
      </ConfirmDialog>
    </div>
  );
}

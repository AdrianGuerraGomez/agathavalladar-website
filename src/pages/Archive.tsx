import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArticleRow } from '@/components/articles/ArticleRow';
import { Pagination } from '@/components/articles/Pagination';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useArchive, useCategories } from '@/hooks/queries';
import { usePageMeta } from '@/lib/meta';
import { SITE } from '@/lib/site';
import styles from './Archive.module.css';

export default function Archive() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('pagina')) || 1);
  const categorySlug = params.get('categoria');
  const query = params.get('q') ?? '';
  const [draft, setDraft] = useState(query);

  useEffect(() => setDraft(query), [query]);

  // Búsqueda con retardo: actualiza la URL al dejar de escribir.
  useEffect(() => {
    if (draft === query) return;
    const t = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (draft.trim()) next.set('q', draft.trim());
      else next.delete('q');
      next.delete('pagina');
      setParams(next, { replace: true });
    }, 350);
    return () => window.clearTimeout(t);
  }, [draft, query, params, setParams]);

  const categories = useCategories();
  const archive = useArchive({ page, pageSize: SITE.archivePageSize, categorySlug, query });
  const activeCategory = categories.data?.find((c) => c.slug === categorySlug) ?? null;
  const total = archive.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / SITE.archivePageSize));

  usePageMeta({
    title: activeCategory ? `${activeCategory.name} · Publicaciones` : 'Publicaciones',
    description: activeCategory
      ? `Artículos de Agatha Valladar sobre ${activeCategory.name.toLowerCase()}.`
      : 'Archivo de artículos y análisis de Agatha Valladar sobre política exterior, relaciones transatlánticas y Unión Europea.',
    path: `/publicaciones${categorySlug ? `?categoria=${categorySlug}` : ''}`,
    noindex: !!query || page > 1,
  });

  const categoryHref = (slug: string | null) => {
    const next = new URLSearchParams();
    if (slug) next.set('categoria', slug);
    if (query) next.set('q', query);
    const qs = next.toString();
    return `/publicaciones${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="container">
      <header className={styles.header}>
        <p className={`label ${styles.kicker}`}>Archivo</p>
        <h1 className={styles.title}>{activeCategory ? activeCategory.name : 'Publicaciones'}</h1>
        <p className={styles.intro}>
          {activeCategory?.description ||
            'Artículos y análisis sobre política exterior estadounidense, relaciones transatlánticas, Unión Europea y geopolítica, en orden cronológico.'}
        </p>
      </header>

      <div className={styles.toolbar}>
        <nav aria-label="Filtrar por temática" className={styles.filters}>
          <ul role="list" className={styles.filterList}>
            <li>
              <Link to={categoryHref(null)} className={`${styles.filter} ${!categorySlug ? styles.filterActive : ''}`} aria-current={!categorySlug ? 'true' : undefined}>
                Todas
              </Link>
            </li>
            {(categories.data ?? []).map((c) => (
              <li key={c.id}>
                <Link
                  to={categoryHref(c.slug)}
                  className={`${styles.filter} ${c.slug === categorySlug ? styles.filterActive : ''}`}
                  aria-current={c.slug === categorySlug ? 'true' : undefined}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <form role="search" className={styles.search} onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="archive-search" className="visually-hidden">Buscar publicaciones</label>
          <Icon icon={faMagnifyingGlass} className={styles.searchIcon} />
          <input
            id="archive-search"
            type="search"
            placeholder="Buscar por palabras clave"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={styles.searchInput}
            autoComplete="off"
          />
          {draft && (
            <button type="button" className={styles.searchClear} onClick={() => setDraft('')} aria-label="Borrar búsqueda">
              <Icon icon={faXmark} />
            </button>
          )}
        </form>
      </div>

      <div className={styles.resultsMeta} aria-live="polite">
        {archive.isFetching && <Spinner label="Actualizando resultados" />}
        {!archive.isPending && (
          <span className="tabular">
            {total === 1 ? '1 publicación' : `${total} publicaciones`}
            {query && <> para «{query}»</>}
          </span>
        )}
      </div>

      {archive.isError ? (
        <ErrorState error={archive.error} onRetry={() => archive.refetch()} />
      ) : archive.isPending ? (
        <div className={styles.loading}><Spinner /></div>
      ) : archive.data.items.length === 0 ? (
        <EmptyState title="No hay publicaciones que coincidan.">
          {query || categorySlug ? (
            <p>
              Prueba con otras palabras o <Link to="/publicaciones" className={styles.reset}>consulta todo el archivo</Link>.
            </p>
          ) : (
            <p>Los primeros artículos aparecerán aquí muy pronto.</p>
          )}
        </EmptyState>
      ) : (
        <div className={`${styles.list} ${archive.isPlaceholderData ? styles.listStale : ''}`}>
          {archive.data.items.map((a) => <ArticleRow key={a.id} article={a} headingLevel={2} />)}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}

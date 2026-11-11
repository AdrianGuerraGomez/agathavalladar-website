import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Link, useSearchParams } from 'react-router';
import { Icon } from '@/components/ui/Icon';
import styles from './articles.module.css';

function pageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] as number) > 1) out.push('…');
    out.push(p);
  });
  return out;
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const [params] = useSearchParams();
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const next = new URLSearchParams(params);
    if (p === 1) next.delete('pagina');
    else next.set('pagina', String(p));
    const qs = next.toString();
    return `/publicaciones${qs ? `?${qs}` : ''}`;
  };

  return (
    <nav className={styles.pagination} aria-label="Paginación">
      {page > 1 ? (
        <Link to={href(page - 1)} className={styles.pageEdge} rel="prev">
          <Icon icon={faArrowLeft} /> Anterior
        </Link>
      ) : <span className={styles.pageEdge} aria-hidden />}
      <ol role="list" className={styles.pageList}>
        {pageList(page, totalPages).map((p, i) =>
          p === '…' ? (
            <li key={`gap-${i}`} className={styles.pageGap} aria-hidden>…</li>
          ) : (
            <li key={p}>
              <Link
                to={href(p)}
                className={`tabular ${styles.pageNumber} ${p === page ? styles.pageCurrent : ''}`}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Página ${p}`}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ol>
      {page < totalPages ? (
        <Link to={href(page + 1)} className={`${styles.pageEdge} ${styles.pageEdgeNext}`} rel="next">
          Siguiente <Icon icon={faArrowRight} />
        </Link>
      ) : <span className={styles.pageEdge} aria-hidden />}
    </nav>
  );
}

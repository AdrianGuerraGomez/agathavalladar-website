import { displayStatus } from '@/services/articles';
import type { Article } from '@/types/content';
import styles from '../admin.module.css';

const LABELS = { draft: 'Borrador', scheduled: 'Programado', published: 'Publicado' } as const;

export function StatusBadge({ article }: { article: Pick<Article, 'status' | 'published_at'> }) {
  const s = displayStatus(article);
  return <span className={`${styles.badge} ${styles[`badge-${s}`]}`}>{LABELS[s]}</span>;
}

export { LABELS as STATUS_LABELS };

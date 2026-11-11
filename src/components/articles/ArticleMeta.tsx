import { Link } from 'react-router';
import { formatDate } from '@/lib/format';
import type { Category } from '@/types/content';
import styles from './articles.module.css';

export function CategoryLabel({ category, link = true }: { category: Category | null; link?: boolean }) {
  if (!category) return null;
  return link ? (
    <Link to={`/publicaciones?categoria=${category.slug}`} className={`label ${styles.category}`}>
      {category.name}
    </Link>
  ) : (
    <span className={`label ${styles.category}`}>{category.name}</span>
  );
}

export function DateLabel({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} className={`tabular ${styles.date}`}>
      {formatDate(iso)}
    </time>
  );
}

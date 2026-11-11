import { Link } from 'react-router';
import { dateParts } from '@/lib/format';
import { articlePath } from '@/lib/site';
import type { ArticleSummary } from '@/types/content';
import { ArticleImage } from './ArticleImage';
import { CategoryLabel } from './ArticleMeta';
import styles from './articles.module.css';

/** Fila de índice: fecha | texto | miniatura. Usada en el archivo y en «Recientes». */
export function ArticleRow({ article, showImage = true, headingLevel = 3 }: { article: ArticleSummary; showImage?: boolean; headingLevel?: 2 | 3 }) {
  const { day, month, year } = dateParts(article.published_at);
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className={`${styles.row} ${showImage ? styles.rowWithImage : ''}`} data-reveal>
      <time dateTime={article.published_at} className={`tabular ${styles.rowDate}`}>
        <span className={styles.rowDay}>{day}</span>
        <span>{month} {year}</span>
      </time>
      <div className={styles.rowBody}>
        <CategoryLabel category={article.category} />
        <Heading className={styles.rowTitle}>
          <Link to={articlePath(article.slug)} className={styles.titleLink}>{article.title}</Link>
        </Heading>
        <p className={styles.rowExcerpt}>{article.excerpt}</p>
      </div>
      {showImage && (
        <Link to={articlePath(article.slug)} className={styles.rowImage} tabIndex={-1} aria-hidden>
          <ArticleImage image={article.cover_image} ratio="3/2" sizes="(min-width: 900px) 22vw, 30vw" />
        </Link>
      )}
    </article>
  );
}

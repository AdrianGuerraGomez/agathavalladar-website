import { Link } from 'react-router';
import { articlePath } from '@/lib/site';
import type { ArticleSummary } from '@/types/content';
import { ArticleImage } from './ArticleImage';
import { CategoryLabel, DateLabel } from './ArticleMeta';
import styles from './articles.module.css';

/** Artículo principal de portada: imagen grande y titular destacado. */
export function ArticleLead({ article }: { article: ArticleSummary }) {
  return (
    <article className={styles.lead}>
      <Link to={articlePath(article.slug)} className={styles.leadImage} tabIndex={-1} aria-hidden>
        <ArticleImage image={article.cover_image} ratio="3/2" priority sizes="(min-width: 900px) 60vw, 100vw" />
      </Link>
      <div className={styles.leadText}>
        <CategoryLabel category={article.category} />
        <h3 className={styles.leadTitle}>
          <Link to={articlePath(article.slug)} className={styles.titleLink}>{article.title}</Link>
        </h3>
        <p className={styles.leadExcerpt}>{article.excerpt}</p>
        <DateLabel iso={article.published_at} />
      </div>
    </article>
  );
}

/** Artículo destacado secundario. */
export function ArticleTeaser({ article }: { article: ArticleSummary }) {
  return (
    <article className={styles.teaser}>
      <Link to={articlePath(article.slug)} tabIndex={-1} aria-hidden className={styles.teaserImage}>
        <ArticleImage image={article.cover_image} ratio="16/9" sizes="(min-width: 900px) 30vw, 100vw" />
      </Link>
      <CategoryLabel category={article.category} />
      <h3 className={styles.teaserTitle}>
        <Link to={articlePath(article.slug)} className={styles.titleLink}>{article.title}</Link>
      </h3>
      <p className={styles.teaserExcerpt}>{article.excerpt}</p>
      <DateLabel iso={article.published_at} />
    </article>
  );
}

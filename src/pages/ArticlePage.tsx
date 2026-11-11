import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArticleImage } from '@/components/articles/ArticleImage';
import { CategoryLabel } from '@/components/articles/ArticleMeta';
import { ShareBar } from '@/components/articles/ShareBar';
import { Icon } from '@/components/ui/Icon';
import { PageLoader } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';
import { useArticle, useArticleNeighbors } from '@/hooks/queries';
import { formatDate, formatTime, plainText, readingMinutes, truncate } from '@/lib/format';
import { imageUrl } from '@/lib/images';
import { usePageMeta } from '@/lib/meta';
import { sanitizeWithLinks, splitBodyForInsert } from '@/lib/sanitize';
import { SITE, absoluteUrl, articlePath } from '@/lib/site';
import type { ArticleImage as Img } from '@/types/content';
import NotFound from './NotFound';
import styles from './ArticlePage.module.css';

function Figure({ image, priority, wide }: { image: Img; priority?: boolean; wide?: boolean }) {
  return (
    <figure className={`${styles.figure} ${wide ? styles.figureWide : ''}`}>
      <ArticleImage image={image} ratio="natural" priority={priority} />
      {image.caption && <figcaption className={styles.caption}>{image.caption}</figcaption>}
    </figure>
  );
}

function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return <div className={styles.progress} style={{ transform: `scaleX(${progress})` }} aria-hidden />;
}

export default function ArticlePage() {
  const { slug = '' } = useParams();
  const { data: article, isPending, isError, error, refetch } = useArticle(slug);
  const neighbors = useArticleNeighbors(article);

  const [firstHalf, secondHalf] = useMemo(
    () => {
      if (!article) return ['', ''];
      return article.secondary_image ? splitBodyForInsert(article.body) : [sanitizeWithLinks(article.body), ''];
    },
    [article],
  );

  const description = article ? article.seo_description || truncate(article.excerpt || plainText(article.body), 160) : undefined;
  usePageMeta(
    article
      ? {
          title: article.seo_title || article.title,
          description,
          path: articlePath(article.slug),
          image: imageUrl(article.cover_image),
          type: 'article',
          publishedTime: article.published_at,
          modifiedTime: article.updated_at,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description,
            image: article.cover_image ? [absoluteUrl(imageUrl(article.cover_image)!)] : undefined,
            datePublished: article.published_at,
            dateModified: article.updated_at,
            inLanguage: 'es',
            articleSection: article.category?.name,
            author: { '@type': 'Person', name: SITE.name, url: absoluteUrl('/sobre-mi') },
            publisher: { '@type': 'Person', name: SITE.name },
            mainEntityOfPage: absoluteUrl(articlePath(article.slug)),
          },
        }
      : { title: 'Publicación' },
  );

  if (isPending) return <PageLoader />;
  if (isError) return <div className="container"><ErrorState error={error} onRetry={() => refetch()} /></div>;
  if (!article) return <NotFound />;

  const url = absoluteUrl(articlePath(article.slug));
  const minutes = readingMinutes(article.body);

  return (
    <>
      <ReadingProgress />
      <article className={styles.article}>
        <header className={`container ${styles.header}`}>
          <nav aria-label="Ruta" className={styles.breadcrumb}>
            <Link to="/publicaciones">Publicaciones</Link>
            {article.category && (
              <>
                <span aria-hidden>/</span>
                <CategoryLabel category={article.category} />
              </>
            )}
          </nav>
          <h1 className={styles.title}>{article.title}</h1>
          {article.excerpt && <p className={styles.excerpt}>{article.excerpt}</p>}
          <div className={styles.meta}>
            <div className={styles.metaText}>
              <span className={styles.author}>{SITE.name}</span>
              <span className={`tabular ${styles.metaLine}`}>
                <time dateTime={article.published_at}>
                  {formatDate(article.published_at)} · {formatTime(article.published_at)} h
                </time>
                <span aria-hidden> · </span>
                {minutes} min de lectura
              </span>
            </div>
            <ShareBar url={url} title={article.title} compact />
          </div>
        </header>

        {article.cover_image && (
          <div className="container">
            <Figure image={article.cover_image} priority wide />
          </div>
        )}

        <div className={`container ${styles.bodyWrap}`}>
          <div className={`prose ${styles.body}`} dangerouslySetInnerHTML={{ __html: firstHalf }} />
          {article.secondary_image && <Figure image={article.secondary_image} />}
          {secondHalf && <div className={`prose ${styles.body}`} dangerouslySetInnerHTML={{ __html: secondHalf }} />}

          <footer className={styles.footer}>
            <ShareBar url={url} title={article.title} />
            <div className={styles.authorBox}>
              <p className="label">Sobre la autora</p>
              <p>
                <strong>{SITE.name}</strong> es investigadora becada en el Instituto Franklin. Analiza la política exterior
                estadounidense, las relaciones transatlánticas y la Unión Europea.{' '}
                <Link to="/sobre-mi">Perfil completo</Link>
              </p>
            </div>
          </footer>
        </div>
      </article>

      <nav className={`container ${styles.adjacent}`} aria-label="Más publicaciones">
        <div className={styles.adjacentGrid}>
          {neighbors.data?.previous ? (
            <Link to={articlePath(neighbors.data.previous.slug)} className={styles.adjacentLink} rel="prev">
              <span className={`label ${styles.adjacentLabel}`}><Icon icon={faArrowLeft} /> Anterior</span>
              <span className={styles.adjacentTitle}>{neighbors.data.previous.title}</span>
            </Link>
          ) : <span />}
          {neighbors.data?.next ? (
            <Link to={articlePath(neighbors.data.next.slug)} className={`${styles.adjacentLink} ${styles.adjacentNext}`} rel="next">
              <span className={`label ${styles.adjacentLabel}`}>Siguiente <Icon icon={faArrowRight} /></span>
              <span className={styles.adjacentTitle}>{neighbors.data.next.title}</span>
            </Link>
          ) : <span />}
        </div>
        <Link to="/publicaciones" className={styles.back}>
          <Icon icon={faArrowLeft} /> Volver al archivo de publicaciones
        </Link>
      </nav>
    </>
  );
}

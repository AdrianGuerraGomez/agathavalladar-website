import type React from 'react';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router';
import { ArticleLead, ArticleTeaser } from '@/components/articles/ArticleLead';
import { ArticleRow } from '@/components/articles/ArticleRow';
import { SectionHeader } from '@/components/articles/SectionHeader';
import { Icon } from '@/components/ui/Icon';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { useCategories, useFeaturedArticles, useProfile, useRecentArticles } from '@/hooks/queries';
import { formatToday } from '@/lib/format';
import { useScrollShift } from '@/lib/motion';
import { usePageMeta } from '@/lib/meta';
import { SITE, absoluteUrl } from '@/lib/site';
import styles from './Home.module.css';

export default function Home() {
  const profile = useProfile();
  const featured = useFeaturedArticles(3);
  const recent = useRecentArticles(6);
  const categories = useCategories();
  const heroRef = useScrollShift<HTMLDivElement>(0.16);

  usePageMeta({
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: SITE.name,
      url: absoluteUrl('/'),
      jobTitle: 'Investigadora',
      affiliation: { '@type': 'Organization', name: 'Instituto Franklin' },
      knowsAbout: ['Política exterior estadounidense', 'Relaciones internacionales', 'Relaciones transatlánticas', 'Unión Europea', 'Geopolítica'],
      address: { '@type': 'PostalAddress', addressLocality: 'Guadalajara', addressRegion: 'Castilla-La Mancha', addressCountry: 'ES' },
    },
  });

  const p = profile.data;
  // Sin destacados marcados, el artículo más reciente ocupa la posición principal.
  const [lead, ...teasers] = featured.data?.length ? featured.data : (recent.data ?? []).slice(0, 1);
  const shownIds = new Set([lead, ...teasers].filter(Boolean).map((a) => a.id));
  const recentList = (recent.data ?? []).filter((a) => !shownIds.has(a.id)).slice(0, 4);

  return (
    <>
      {/* Cabecera editorial ------------------------------------------------ */}
      <section className={`container ${styles.hero}`} aria-labelledby="hero-title">
        <div className={styles.dateline}>
          <span>{p?.location?.split(',')[0] || 'Guadalajara'}, España</span>
          <span className={styles.datelineDate}>{formatToday()}</span>
        </div>

        <div className={styles.heroGrid}>
          <div className={styles.heroMain} ref={heroRef}>
            <p className={`label ${styles.kicker}`}>{p?.headline || 'Investigadora | Política exterior | Relaciones internacionales'}</p>
            <h1 id="hero-title" className={styles.statement}>
              {p?.home_intro}
            </h1>
          </div>
          <aside className={styles.heroAside} aria-label="Áreas de investigación" data-reveal style={{ '--reveal-delay': '200ms' } as React.CSSProperties}>
            <p className={`label ${styles.asideLabel}`}>Áreas</p>
            <ul role="list" className={styles.areaList}>
              {(categories.data ?? []).map((c) => (
                <li key={c.id}>
                  <Link to={`/publicaciones?categoria=${c.slug}`} className={styles.areaLink}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/publicaciones" className={styles.heroCta}>
              Ver todas las publicaciones <Icon icon={faArrowRight} />
            </Link>
          </aside>
        </div>
      </section>

      {/* 01 Destacados ----------------------------------------------------- */}
      <section className={`container ${styles.section}`} aria-labelledby="destacados">
        <SectionHeader index="01" title="Destacados" id="destacados" />
        {featured.isError ? (
          <ErrorState error={featured.error} onRetry={() => featured.refetch()} />
        ) : featured.isPending ? (
          <div className={styles.skeletonLead} aria-hidden />
        ) : lead ? (
          <>
            <ArticleLead article={lead} />
            {teasers.length > 0 && (
              <div className={styles.teasers}>
                {teasers.map((a, i) => <ArticleTeaser key={a.id} article={a} index={i} />)}
              </div>
            )}
          </>
        ) : (
          <EmptyState title="Todavía no hay artículos publicados.">Los primeros análisis aparecerán aquí muy pronto.</EmptyState>
        )}
      </section>

      {/* 02 Recientes ------------------------------------------------------ */}
      {recentList.length > 0 && (
        <section className={`container ${styles.section}`} aria-labelledby="recientes">
          <SectionHeader index="02" title="Publicaciones recientes" id="recientes" link={{ to: '/publicaciones', label: 'Archivo completo' }} />
          <div className={styles.recentGrid}>
            {recentList.map((a) => <ArticleRow key={a.id} article={a} />)}
          </div>
        </section>
      )}

      {/* 03 Líneas de investigación --------------------------------------- */}
      {p && p.research_lines.length > 0 && (
        <section className={`container ${styles.section}`} aria-labelledby="lineas">
          <SectionHeader index="03" title="Líneas de investigación" id="lineas" />
          <ol role="list" className={styles.lines}>
            {p.research_lines.map((line, i) => (
              <li key={line.title} className={styles.line} data-reveal style={{ '--reveal-delay': `${(i % 3) * 90}ms` } as React.CSSProperties}>
                <span className={`tabular ${styles.lineIndex}`}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className={styles.lineTitle}>{line.title}</h3>
                <p className={styles.lineText}>{line.description}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 04 Sobre la autora ------------------------------------------------ */}
      {p?.home_about && (
        <section className={`container ${styles.section}`} aria-labelledby="autora">
          <SectionHeader index="04" title="Sobre la autora" id="autora" />
          <div className={styles.about} data-reveal>
            <p className={styles.aboutName}>{SITE.name}</p>
            <div className={styles.aboutBody}>
              <p className={styles.aboutText}>{p.home_about}</p>
              <Link to="/sobre-mi" className={styles.heroCta}>
                Perfil completo <Icon icon={faArrowRight} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Archivo ----------------------------------------------------------- */}
      <section className={`container ${styles.archiveCta}`}>
        <Link to="/publicaciones" className={styles.archiveLink} data-reveal>
          <span className="label">Archivo</span>
          <span className={styles.archiveText}>Consulta todas las publicaciones</span>
          <Icon icon={faArrowRight} className={styles.archiveArrow} />
        </Link>
      </section>
    </>
  );
}

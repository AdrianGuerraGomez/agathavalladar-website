import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router';
import { SectionHeader } from '@/components/articles/SectionHeader';
import { Icon } from '@/components/ui/Icon';
import { PageLoader } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';
import { useProfile } from '@/hooks/queries';
import { plainText } from '@/lib/format';
import { usePageMeta } from '@/lib/meta';
import { sanitizeWithLinks } from '@/lib/sanitize';
import { SITE, absoluteUrl } from '@/lib/site';
import styles from './About.module.css';

const hasContent = (html: string | null | undefined) => !!html && plainText(html).length > 0;

export default function About() {
  const { data: p, isPending, isError, error, refetch } = useProfile();

  usePageMeta({
    title: 'Sobre mí',
    description: p?.home_about || SITE.defaultDescription,
    path: '/sobre-mi',
    type: 'profile',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: SITE.name,
        url: absoluteUrl('/sobre-mi'),
        jobTitle: 'Investigadora',
        affiliation: { '@type': 'Organization', name: 'Instituto Franklin' },
        sameAs: [p?.linkedin_url, p?.x_url].filter(Boolean),
      },
    },
  });

  if (isPending) return <PageLoader />;
  if (isError || !p) return <div className="container"><ErrorState error={error} onRetry={() => refetch()} /></div>;

  const sections = [
    { id: 'perfil', title: 'Perfil investigador', html: p.research_profile },
    { id: 'instituto-franklin', title: 'Instituto Franklin', html: p.franklin },
    { id: 'trayectoria', title: 'Trayectoria', html: p.trajectory },
  ].filter((s) => hasContent(s.html));

  let index = 0;
  const next = () => String(++index).padStart(2, '0');

  return (
    <div className="container">
      <header className={styles.header}>
        <p className={`label ${styles.kicker}`}>Sobre mí</p>
        <h1 className={styles.name}>{SITE.name}</h1>
        <p className={styles.headline}>{p.headline}</p>
      </header>

      {hasContent(p.about_intro) && (
        <section className={styles.intro} aria-label="Presentación" data-reveal>
          <div className={`prose ${styles.introText}`} dangerouslySetInnerHTML={{ __html: sanitizeWithLinks(p.about_intro) }} />
        </section>
      )}

      {sections.map((s) => (
        <section key={s.id} className={styles.section} aria-labelledby={s.id}>
          <SectionHeader index={next()} title={s.title} id={s.id} />
          <div className={styles.twoCol} data-reveal>
            <div />
            <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeWithLinks(s.html) }} />
          </div>
        </section>
      ))}

      {p.research_lines.length > 0 && (
        <section className={styles.section} aria-labelledby="lineas">
          <SectionHeader index={next()} title="Áreas y líneas de investigación" id="lineas" />
          <ol role="list" className={styles.lines}>
            {p.research_lines.map((l) => (
              <li key={l.title} className={styles.lineItem} data-reveal>
                <h3>{l.title}</h3>
                <p>{l.description}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className={styles.section} data-reveal>
        <div className={styles.twoCol}>
          <div />
          <div>
            <p className={styles.contactLead}>¿Colaboraciones, entrevistas o consultas sobre mis publicaciones?</p>
            <Link to="/contacto" className={styles.cta}>
              Ir a contacto <Icon icon={faArrowRight} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

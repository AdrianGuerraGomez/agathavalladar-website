import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from '@/components/ui/Icon';
import styles from './articles.module.css';

interface Props {
  index?: string;
  title: string;
  id?: string;
  link?: { to: string; label: string };
  children?: ReactNode;
}

/** Encabezado de sección numerado: filete fuerte + «01 Título». */
export function SectionHeader({ index, title, id, link }: Props) {
  return (
    <header className={styles.sectionHeader} data-reveal>
      <h2 id={id} className={`label ${styles.sectionTitle}`}>
        {index && <span className={`tabular ${styles.sectionIndex}`}>{index}</span>}
        {title}
      </h2>
      {link && (
        <Link to={link.to} className={styles.sectionLink}>
          {link.label} <Icon icon={faArrowRight} />
        </Link>
      )}
    </header>
  );
}

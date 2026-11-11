import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router';
import { Icon } from '@/components/ui/Icon';
import { usePageMeta } from '@/lib/meta';
import styles from './About.module.css';

export default function NotFound() {
  usePageMeta({ title: 'Página no encontrada', noindex: true });
  return (
    <div className={`container ${styles.notFound}`}>
      <p className="label">Error 404</p>
      <h1>Esta página no existe o ya no está disponible.</h1>
      <p>Es posible que el enlace sea antiguo o que la publicación se haya retirado.</p>
      <Link to="/publicaciones" className={styles.cta}>
        Ir al archivo de publicaciones <Icon icon={faArrowRight} />
      </Link>
    </div>
  );
}

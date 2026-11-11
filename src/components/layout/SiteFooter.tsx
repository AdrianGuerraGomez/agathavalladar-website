import { faLinkedinIn, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router';
import { Icon } from '@/components/ui/Icon';
import { useProfile } from '@/hooks/queries';
import { SITE } from '@/lib/site';
import styles from './layout.module.css';

export function SiteFooter() {
  const { data: profile } = useProfile();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerGrid}`}>
        <div className={styles.footerIdentity}>
          <Link to="/" className={styles.wordmark}>{SITE.wordmark}</Link>
          <p className={styles.footerText}>
            Investigadora becada en el Instituto Franklin.
            <br />
            {profile?.location || 'Guadalajara, Castilla-La Mancha, España'}
          </p>
        </div>

        <nav aria-label="Pie de página" className={styles.footerCol}>
          <p className={`label ${styles.footerLabel}`}>Secciones</p>
          <ul role="list">
            <li><Link to="/publicaciones">Publicaciones</Link></li>
            <li><Link to="/sobre-mi">Sobre mí</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
          </ul>
        </nav>

        {(profile?.contact_email || profile?.linkedin_url || profile?.x_url) && (
          <div className={styles.footerCol}>
            <p className={`label ${styles.footerLabel}`}>En otros lugares</p>
            <ul role="list">
              {profile.contact_email && (
                <li><a href={`mailto:${profile.contact_email}`}><Icon icon={faEnvelope} fixedWidth /> Correo</a></li>
              )}
              {profile.linkedin_url && (
                <li><a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer me"><Icon icon={faLinkedinIn} fixedWidth /> LinkedIn</a></li>
              )}
              {profile.x_url && (
                <li><a href={profile.x_url} target="_blank" rel="noopener noreferrer me"><Icon icon={faXTwitter} fixedWidth /> X</a></li>
              )}
            </ul>
          </div>
        )}
      </div>
      <div className={`container ${styles.footerBottom}`}>
        <p>© {year} {SITE.name}. Las opiniones expresadas son personales.</p>
      </div>
    </footer>
  );
}

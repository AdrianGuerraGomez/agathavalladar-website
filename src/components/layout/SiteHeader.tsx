import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router';
import { SITE } from '@/lib/site';
import styles from './layout.module.css';

const NAV = [
  { to: '/publicaciones', label: 'Publicaciones' },
  { to: '/sobre-mi', label: 'Sobre mí' },
  { to: '/contacto', label: 'Contacto' },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
      <div className={`container ${styles.headerInner}`}>
        <Link to="/" className={styles.wordmark} aria-label={`${SITE.name}, inicio`}>
          {SITE.wordmark}
        </Link>
        <nav aria-label="Principal">
          <ul role="list" className={styles.nav}>
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

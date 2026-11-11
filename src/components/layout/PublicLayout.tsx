import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { isDemoMode } from '@/lib/env';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { useEffect, useRef } from 'react';
import { useRevealOnScroll } from '@/lib/motion';
import styles from './layout.module.css';

export function PublicLayout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  useRevealOnScroll(mainRef, location.pathname);

  // Desplazamiento a anclas (#contacto) tras navegar.
  useEffect(() => {
    if (!location.hash) return;
    const t = window.setTimeout(() => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.hash]);

  return (
    <>
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      {isDemoMode && (
        <div className={styles.demoBanner} role="note">
          Modo demostración · contenido de ejemplo. Conecta Supabase para publicar contenido real.
        </div>
      )}
      <SiteHeader />
      <main ref={mainRef} id="contenido" key={location.pathname} className={`page-enter ${styles.main}`}>
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration getKey={(l) => (l.key === 'default' ? l.pathname : l.key)} />
    </>
  );
}

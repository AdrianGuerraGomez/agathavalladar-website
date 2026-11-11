import { faArrowUpRightFromSquare, faFileLines, faFolderTree, faPenToSquare, faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Navigate, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router';
import { Icon } from '@/components/ui/Icon';
import { PageLoader } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { isDemoMode } from '@/lib/env';
import { checkIsAdmin, signOut } from '@/services/auth';
import styles from './admin.module.css';

const NAV = [
  { to: '/admin', label: 'Artículos', icon: faFileLines, end: true },
  { to: '/admin/articulos/nuevo', label: 'Nuevo artículo', icon: faPenToSquare, end: true },
  { to: '/admin/categorias', label: 'Categorías', icon: faFolderTree, end: true },
  { to: '/admin/perfil', label: 'Perfil y web', icon: faUser, end: true },
];

function NavItems() {
  return (
    <>
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
          <Icon icon={n.icon} />
          <span>{n.label}</span>
        </NavLink>
      ))}
    </>
  );
}

/**
 * Protección de rutas del CMS: exige sesión y que el usuario figure como
 * administrador en la base de datos. (La seguridad real está en RLS.)
 */
export default function AdminLayout() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const admin = useQuery({
    queryKey: ['is-admin', session?.user.id],
    queryFn: checkIsAdmin,
    enabled: !!session,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';
    document.title = 'Panel — Agatha Valladar';
  }, [location.pathname]);

  useEffect(() => {
    if (admin.data === false) {
      signOut().then(() => navigate('/admin/login', { replace: true, state: { denied: true } }));
    }
  }, [admin.data, navigate]);

  if (isDemoMode) {
    return (
      <div className={styles.centerBox}>
        <div>
          <h1>El panel necesita Supabase</h1>
          <p>
            La web está en modo demostración. Configura <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>{' '}
            siguiendo el README para activar la administración.
          </p>
        </div>
      </div>
    );
  }

  if (loading || (session && admin.isPending)) return <PageLoader />;
  if (!session) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (admin.isError) {
    return (
      <div className={styles.centerBox}>
        <div>
          <h1>No se pudo verificar el acceso</h1>
          <p>{admin.error.message}</p>
        </div>
      </div>
    );
  }
  if (!admin.data) return <PageLoader />;

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <p className={styles.brandName}>AGATHA VALLADAR</p>
          <p className={styles.brandSub}>Panel de publicación</p>
        </div>
        <nav aria-label="Administración" className={styles.navList}>
          <NavItems />
        </nav>
        <div className={styles.sidebarFooter}>
          <a href="/" target="_blank" rel="noopener" className={styles.navItem}>
            <Icon icon={faArrowUpRightFromSquare} /> <span>Ver la web</span>
          </a>
          <button type="button" onClick={handleSignOut} className={styles.navItem}>
            <Icon icon={faRightFromBracket} /> <span>Cerrar sesión</span>
          </button>
          <p className={styles.userEmail} title={session.user.email}>{session.user.email}</p>
        </div>
      </aside>

      <nav className={styles.mobileBar} aria-label="Administración">
        <span className={styles.mobileBrand}>AV · Panel</span>
        <NavItems />
        <button type="button" onClick={handleSignOut} className={styles.navItem} aria-label="Cerrar sesión">
          <Icon icon={faRightFromBracket} />
        </button>
      </nav>

      <div className={styles.content}>
        <Outlet />
      </div>
      <ScrollRestoration getKey={(l) => (l.key === 'default' ? l.pathname : l.key)} />
    </div>
  );
}

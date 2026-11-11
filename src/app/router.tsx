import { createBrowserRouter } from 'react-router';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { PageLoader } from '@/components/ui/Spinner';
import About from '@/pages/About';
import Archive from '@/pages/Archive';
import ArticlePage from '@/pages/ArticlePage';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import { RouteError } from './RouteError';

/**
 * Web pública en el bundle principal; el CMS se carga bajo demanda
 * (el editor y sus dependencias nunca llegan a los lectores).
 */
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      { index: true, element: <Home /> },
      { path: 'publicaciones', element: <Archive /> },
      { path: 'publicaciones/:slug', element: <ArticlePage /> },
      { path: 'sobre-mi', element: <About /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: 'admin',
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      { path: 'login', lazy: async () => ({ Component: (await import('@/admin/pages/Login')).default }) },
      {
        lazy: async () => ({ Component: (await import('@/admin/AdminLayout')).default }),
        children: [
          { index: true, lazy: async () => ({ Component: (await import('@/admin/pages/ArticlesList')).default }) },
          { path: 'articulos/nuevo', lazy: async () => ({ Component: (await import('@/admin/pages/ArticleEditor')).default }) },
          { path: 'articulos/:id', lazy: async () => ({ Component: (await import('@/admin/pages/ArticleEditor')).default }) },
          { path: 'categorias', lazy: async () => ({ Component: (await import('@/admin/pages/Categories')).default }) },
          { path: 'perfil', lazy: async () => ({ Component: (await import('@/admin/pages/ProfileEditor')).default }) },
        ],
      },
    ],
  },
]);

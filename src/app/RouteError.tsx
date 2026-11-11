import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

/** Error inesperado de ruta (p. ej. fallo al cargar un fragmento tras un despliegue). */
export function RouteError() {
  const error = useRouteError();
  const chunkFailed = error instanceof Error && /dynamically imported module|Importing a module script/i.test(error.message);
  if (import.meta.env.DEV) console.error(error);
  return (
    <div className="container" style={{ paddingBlock: '6rem', maxWidth: '40rem' }}>
      <p className="label" style={{ color: 'var(--color-accent)' }}>Error</p>
      <h1 style={{ marginTop: '1rem', fontSize: '2rem', letterSpacing: '-0.02em' }}>
        {isRouteErrorResponse(error) && error.status === 404
          ? 'Página no encontrada.'
          : chunkFailed
            ? 'Hay una versión nueva de la web.'
            : 'Algo no ha funcionado.'}
      </h1>
      <p style={{ marginTop: '1rem', color: 'var(--color-muted)' }}>
        {chunkFailed ? 'Recarga la página para continuar.' : 'Vuelve a intentarlo en unos instantes.'}
      </p>
      <p style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem' }}>
        <button type="button" onClick={() => window.location.reload()} style={{ textDecoration: 'underline' }}>
          Recargar
        </button>
        <Link to="/" style={{ textDecoration: 'underline' }}>Ir al inicio</Link>
      </p>
    </div>
  );
}

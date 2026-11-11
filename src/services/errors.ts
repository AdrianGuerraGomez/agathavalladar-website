/** Traduce errores técnicos a mensajes comprensibles. */
export class AppError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'AppError';
  }
}

interface PgLikeError {
  message?: string;
  code?: string;
  details?: string;
}

export function toAppError(error: unknown, fallback = 'Ha ocurrido un error inesperado.'): AppError {
  if (error instanceof AppError) return error;
  const e = (error ?? {}) as PgLikeError;
  const msg = e.message ?? '';
  switch (e.code) {
    case '23505':
      if (msg.includes('slug')) return new AppError('Ya existe un elemento con esa URL. Cambia la URL (slug).', e.code);
      return new AppError('Ya existe un elemento con esos datos.', e.code);
    case '23503':
      return new AppError('No se puede eliminar: hay artículos que dependen de este elemento.', e.code);
    case '23514':
      if (msg.includes('articles_published_complete'))
        return new AppError('Para publicar se necesitan imagen principal, categoría, entradilla y cuerpo.', e.code);
      return new AppError('Algún campo no cumple el formato requerido.', e.code);
    case '42501':
      return new AppError('No tienes permiso para realizar esta acción.', e.code);
    case 'PGRST301':
    case 'PGRST303':
      return new AppError('Tu sesión ha caducado. Vuelve a iniciar sesión.', e.code);
  }
  if (/row-level security/i.test(msg)) return new AppError('No tienes permiso para realizar esta acción.', '42501');
  if (/Failed to fetch|NetworkError/i.test(msg)) return new AppError('Sin conexión con el servidor. Comprueba tu conexión a internet.');
  if (/Invalid login credentials/i.test(msg)) return new AppError('Email o contraseña incorrectos.');
  if (/Email not confirmed/i.test(msg)) return new AppError('El email todavía no está confirmado.');
  if (/rate limit/i.test(msg)) return new AppError('Demasiados intentos. Espera unos minutos.');
  if (import.meta.env.DEV) console.error(error);
  return new AppError(msg && msg.length < 160 ? msg : fallback, e.code);
}

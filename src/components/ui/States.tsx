import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import styles from './ui.module.css';

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyTitle}>{title}</p>
      {children && <div className={styles.emptyBody}>{children}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Ha ocurrido un error.';
  return (
    <div className={styles.error} role="alert">
      <Icon icon={faTriangleExclamation} />
      <div>
        <p>{message}</p>
        {onRetry && (
          <button type="button" className={styles.linkButton} onClick={onRetry}>
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

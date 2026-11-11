import styles from './ui.module.css';

export function Spinner({ label = 'Cargando' }: { label?: string }) {
  return (
    <span className={styles.spinner} role="status">
      <span className="visually-hidden">{label}</span>
    </span>
  );
}

export function PageLoader() {
  return (
    <div className={styles.pageLoader}>
      <Spinner />
    </div>
  );
}

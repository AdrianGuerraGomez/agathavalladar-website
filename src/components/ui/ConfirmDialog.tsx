import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import styles from './ui.module.css';

interface Props {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Diálogo modal accesible basado en <dialog>. */
export function ConfirmDialog({ open, title, children, confirmLabel = 'Confirmar', danger, loading, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className={styles.dialog} onCancel={(e) => { e.preventDefault(); onCancel(); }} aria-labelledby="dialog-title">
      <h2 id="dialog-title" className={styles.dialogTitle}>{title}</h2>
      {children && <div className={styles.dialogBody}>{children}</div>}
      <div className={styles.dialogActions}>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </dialog>
  );
}

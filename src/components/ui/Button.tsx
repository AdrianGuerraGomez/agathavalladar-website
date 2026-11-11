import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import styles from './ui.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const cx = (variant: Variant, size: Size, extra?: string) =>
  [styles.button, styles[`button-${variant}`], size === 'sm' && styles.buttonSm, extra].filter(Boolean).join(' ');

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'secondary', size = 'md', loading, disabled, className, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={cx(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className={styles.buttonSpinner} aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  className,
  ...rest
}: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={cx(variant, size, className)} {...rest} />;
}

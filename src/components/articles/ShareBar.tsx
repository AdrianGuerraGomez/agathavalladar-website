import { faBluesky, faFacebookF, faLinkedinIn, faWhatsapp, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { faCheck, faEnvelope, faLink, faShareNodes } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import styles from './articles.module.css';

export function ShareBar({ url, title, compact }: { url: string; title: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const links = [
    { label: 'LinkedIn', icon: faLinkedinIn, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: 'X', icon: faXTwitter, href: `https://x.com/intent/post?url=${u}&text=${t}` },
    { label: 'Bluesky', icon: faBluesky, href: `https://bsky.app/intent/compose?text=${t}%20${u}` },
    { label: 'Facebook', icon: faFacebookF, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: 'WhatsApp', icon: faWhatsapp, href: `https://wa.me/?text=${t}%20${u}` },
    { label: 'Correo', icon: faEnvelope, href: `mailto:?subject=${t}&body=${u}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt('Copia el enlace:', url);
    }
  }

  return (
    <div className={`${styles.share} ${compact ? styles.shareCompact : ''}`}>
      {!compact && <span className={`label ${styles.shareLabel}`}>Compartir</span>}
      <ul role="list" className={styles.shareList}>
        {(compact ? links.slice(0, 2) : links).map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              target={l.href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className={styles.shareButton}
              aria-label={`Compartir en ${l.label}`}
              title={l.label}
            >
              <Icon icon={l.icon} />
            </a>
          </li>
        ))}
        <li>
          <button type="button" onClick={copy} className={styles.shareButton} aria-label="Copiar enlace" title="Copiar enlace">
            <Icon icon={copied ? faCheck : faLink} />
          </button>
        </li>
        {canNativeShare && (
          <li className={styles.shareNative}>
            <button
              type="button"
              className={styles.shareButton}
              aria-label="Más opciones para compartir"
              title="Más opciones"
              onClick={() => navigator.share({ title, url }).catch(() => {})}
            >
              <Icon icon={faShareNodes} />
            </button>
          </li>
        )}
      </ul>
      <span className="visually-hidden" aria-live="polite">{copied ? 'Enlace copiado' : ''}</span>
    </div>
  );
}

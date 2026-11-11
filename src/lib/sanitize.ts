import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'a', 'ul', 'ol', 'li',
  'blockquote', 'hr', 's',
];

/** Sanitiza el HTML editorial antes de insertarlo en la página (defensa en profundidad). */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/|#)/i,
  });
}

let hooked = false;
function ensureLinkHook() {
  if (hooked) return;
  hooked = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') ?? '';
      if (/^https?:/i.test(href) && !href.startsWith(window.location.origin)) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
  });
}

/**
 * Sanitiza y divide el cuerpo en dos mitades por bloques de primer nivel,
 * para intercalar la imagen secundaria a mitad del artículo.
 */
export function splitBodyForInsert(html: string): [string, string] {
  ensureLinkHook();
  const clean = sanitizeHtml(html);
  const doc = new DOMParser().parseFromString(`<div>${clean}</div>`, 'text/html');
  const root = doc.body.firstElementChild!;
  const blocks = Array.from(root.children);
  if (blocks.length < 4) return [clean, ''];
  let cut = Math.ceil(blocks.length / 2);
  // No cortar justo después de un subtítulo.
  while (cut < blocks.length - 1 && /^H[2-4]$/.test(blocks[cut - 1].tagName)) cut++;
  const first = blocks.slice(0, cut).map((b) => b.outerHTML).join('');
  const second = blocks.slice(cut).map((b) => b.outerHTML).join('');
  return [first, second];
}

export function sanitizeWithLinks(html: string): string {
  ensureLinkHook();
  return sanitizeHtml(html);
}

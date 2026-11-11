const TIME_ZONE = 'Europe/Madrid';

const dateLong = new Intl.DateTimeFormat('es-ES', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const dateShort = new Intl.DateTimeFormat('es-ES', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const time = new Intl.DateTimeFormat('es-ES', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});
const weekdayLong = new Intl.DateTimeFormat('es-ES', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export const formatDate = (iso: string) => dateLong.format(new Date(iso));
export const formatDateShort = (iso: string) => dateShort.format(new Date(iso)).replace('.', '');
export const formatTime = (iso: string) => time.format(new Date(iso));
export const formatDateTime = (iso: string) => `${formatDate(iso)}, ${formatTime(iso)} h`;
export const formatToday = () => {
  const s = weekdayLong.format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Partes de fecha para la columna de fecha del archivo. */
export function dateParts(iso: string) {
  const parts = new Intl.DateTimeFormat('es-ES', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { day: get('day'), month: get('month').replace('.', ''), year: get('year') };
}

/** Minutos de lectura (≈ 220 palabras/minuto). */
export function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function wordCount(html: string): number {
  return html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

/** ISO → valor para <input type="datetime-local"> en hora local del navegador. */
export function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInputValue(value: string): string {
  return new Date(value).toISOString();
}

export function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

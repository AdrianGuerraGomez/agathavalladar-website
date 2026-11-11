import type React from 'react';
import { faLinkedinIn, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { faArrowRight, faCheck, faEnvelope, faLocationDot, faPhone } from '@fortawesome/free-solid-svg-icons';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { z } from 'zod';
import { Icon } from '@/components/ui/Icon';
import { ErrorState } from '@/components/ui/States';
import { useProfile } from '@/hooks/queries';
import { usePageMeta } from '@/lib/meta';
import { SITE, absoluteUrl } from '@/lib/site';
import { sendContactMessage } from '@/services/contact';
import styles from './Contact.module.css';

const schema = z.object({
  name: z.string().trim().min(1, 'Escribe tu nombre.').max(120, 'Máximo 120 caracteres.'),
  email: z.string().trim().pipe(z.email('Introduce un email válido.')),
  subject: z.string().max(200, 'Máximo 200 caracteres.'),
  message: z.string().trim().min(10, 'El mensaje es demasiado corto.').max(5000, 'Máximo 5.000 caracteres.'),
  consent: z.literal(true, { error: 'Necesitamos tu consentimiento para responderte.' }),
});

type FormState = { name: string; email: string; subject: string; message: string; consent: boolean; website: string };
const empty: FormState = { name: '', email: '', subject: '', message: '', consent: false, website: '' };
const COOLDOWN_KEY = 'av-contact-sent';

export default function Contact() {
  const { data: p } = useProfile();
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [submitError, setSubmitError] = useState<Error | null>(null);

  usePageMeta({
    title: 'Contacto',
    description: 'Contacto con Agatha Valladar para colaboraciones, entrevistas o consultas sobre sus publicaciones.',
    path: '/contacto',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      url: absoluteUrl('/contacto'),
      mainEntity: { '@type': 'Person', name: SITE.name, email: p?.contact_email ?? undefined, telephone: p?.contact_phone ?? undefined },
    },
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k] ? { ...e, [k]: '' } : e));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    // Campo trampa: los bots lo rellenan, las personas no lo ven.
    if (form.website) {
      setStatus('sent');
      return;
    }
    const res = schema.safeParse(form);
    if (!res.success) {
      setErrors(Object.fromEntries(res.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    try {
      const last = Number(localStorage.getItem(COOLDOWN_KEY) ?? 0);
      if (Date.now() - last < 60_000) {
        setSubmitError(new Error('Acabas de enviar un mensaje. Espera un minuto antes de enviar otro.'));
        return;
      }
    } catch {
      /* almacenamiento no disponible */
    }
    setStatus('sending');
    try {
      await sendContactMessage(res.data);
      try {
        localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      } catch {
        /* sin almacenamiento */
      }
      setStatus('sent');
      setForm(empty);
    } catch (err) {
      setSubmitError(err as Error);
      setStatus('idle');
    }
  }

  const tel = p?.contact_phone?.replace(/[^\d+]/g, '');
  const field = (name: keyof FormState) => ({
    id: `contact-${name}`,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `contact-${name}-error` : undefined,
  });
  const err = (name: string) =>
    errors[name] ? <p id={`contact-${name}-error`} className={styles.error}>{errors[name]}</p> : null;

  return (
    <div className="container">
      <header className={styles.header}>
        <p className={`label ${styles.kicker}`}>Contacto</p>
        <h1 className={styles.title}>Hablemos</h1>
        <p className={styles.intro}>
          Para colaboraciones, entrevistas, conferencias o consultas sobre mis publicaciones. Respondo personalmente a cada mensaje.
        </p>
      </header>

      <div className={styles.grid}>
        <aside className={styles.card} data-reveal aria-label="Datos de contacto">
          <p className={`label ${styles.cardLabel}`}>Directo</p>
          <ul role="list" className={styles.channels}>
            {p?.contact_email && (
              <li>
                <span className={styles.channelIcon}><Icon icon={faEnvelope} /></span>
                <span>
                  <span className={styles.channelName}>Correo</span>
                  <a href={`mailto:${p.contact_email}`} className={styles.channelValue}>{p.contact_email}</a>
                </span>
              </li>
            )}
            {p?.contact_phone && (
              <li>
                <span className={styles.channelIcon}><Icon icon={faPhone} /></span>
                <span>
                  <span className={styles.channelName}>Teléfono</span>
                  <a href={`tel:${tel}`} className={`tabular ${styles.channelValue}`}>{p.contact_phone}</a>
                </span>
              </li>
            )}
            {p?.location && (
              <li>
                <span className={styles.channelIcon}><Icon icon={faLocationDot} /></span>
                <span>
                  <span className={styles.channelName}>Ubicación</span>
                  <span className={styles.channelValue}>{p.location}</span>
                </span>
              </li>
            )}
          </ul>
          {(p?.linkedin_url || p?.x_url) && (
            <div className={styles.social}>
              {p.linkedin_url && (
                <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer me" aria-label="LinkedIn"><Icon icon={faLinkedinIn} /></a>
              )}
              {p.x_url && (
                <a href={p.x_url} target="_blank" rel="noopener noreferrer me" aria-label="X"><Icon icon={faXTwitter} /></a>
              )}
            </div>
          )}
        </aside>

        <section className={styles.formWrap} data-reveal style={{ '--reveal-delay': '120ms' } as React.CSSProperties} aria-labelledby="form-title">
          <h2 id="form-title" className={styles.formTitle}>Escríbeme</h2>

          {status === 'sent' ? (
            <div className={styles.success} role="status">
              <span className={styles.successIcon}><Icon icon={faCheck} /></span>
              <div>
                <p className={styles.successTitle}>Mensaje enviado. Gracias.</p>
                <p>Te responderé lo antes posible al email que has indicado.</p>
                <div className={styles.successActions}>
                  <button type="button" className={styles.linkButton} onClick={() => setStatus('idle')}>Enviar otro mensaje</button>
                  <Link to="/publicaciones" className={styles.linkButton}>Leer publicaciones <Icon icon={faArrowRight} /></Link>
                </div>
              </div>
            </div>
          ) : (
            <form className={styles.form} onSubmit={onSubmit} noValidate>
              {submitError && <ErrorState error={submitError} />}
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label htmlFor="contact-name">Nombre</label>
                  <input {...field('name')} autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} />
                  {err('name')}
                </div>
                <div className={styles.field}>
                  <label htmlFor="contact-email">Email</label>
                  <input {...field('email')} type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                  {err('email')}
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="contact-subject">Asunto <span className={styles.optional}>opcional</span></label>
                <input {...field('subject')} value={form.subject} onChange={(e) => set('subject', e.target.value)} />
                {err('subject')}
              </div>
              <div className={styles.field}>
                <label htmlFor="contact-message">Mensaje</label>
                <textarea {...field('message')} rows={6} value={form.message} onChange={(e) => set('message', e.target.value)} />
                {err('message')}
              </div>
              {/* Campo trampa anti-spam, oculto a personas */}
              <div className={styles.trap} aria-hidden>
                <label htmlFor="contact-website">Web</label>
                <input id="contact-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
              </div>
              <label className={styles.consent}>
                <input type="checkbox" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} aria-invalid={errors.consent ? true : undefined} />
                <span>Acepto que mis datos se utilicen únicamente para responder a este mensaje. No se cederán a terceros.</span>
              </label>
              {err('consent')}
              <div className={styles.actions}>
                <button type="submit" className={styles.submit} disabled={status === 'sending'}>
                  {status === 'sending' ? 'Enviando…' : 'Enviar mensaje'}
                  <Icon icon={faArrowRight} />
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

import { faArrowDown, faArrowUp, faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { useBlocker } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Icon } from '@/components/ui/Icon';
import { PageLoader } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { queryKeys, useProfile } from '@/hooks/queries';
import { toAppError } from '@/services/errors';
import { updateProfile } from '@/services/profile';
import type { SiteProfile } from '@/types/content';
import { RichTextEditor } from '../components/RichTextEditor';
import styles from '../admin.module.css';

type ProfileForm = Omit<SiteProfile, 'updated_at'>;

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => !v || /^https:\/\/\S+\.\S+/.test(v), 'Introduce una URL completa que empiece por https://');

const schema = z.object({
  headline: z.string().trim().min(1, 'Obligatorio.').max(140, 'Máximo 140 caracteres.'),
  home_intro: z.string().trim().min(1, 'Obligatorio.').max(240, 'Máximo 240 caracteres.'),
  home_about: z.string().max(700, 'Máximo 700 caracteres.'),
  contact_email: z.string().trim().refine((v) => !v || z.email().safeParse(v).success, 'Email no válido.'),
  linkedin_url: optionalUrl,
  x_url: optionalUrl,
  location: z.string().max(120, 'Máximo 120 caracteres.'),
  contact_phone: z.string().trim().max(40, 'Máximo 40 caracteres.').refine((v) => !v || /^[+\d][\d\s().-]{5,}$/.test(v), 'Teléfono no válido.'),
  research_lines: z.array(z.object({ title: z.string().trim().min(1, 'Cada línea necesita un título.'), description: z.string() })),
});

export default function ProfileEditor() {
  const profile = useProfile();
  if (profile.isPending) return <PageLoader />;
  if (profile.isError) return <div className={styles.page}><ErrorState error={profile.error} onRetry={() => profile.refetch()} /></div>;
  const { updated_at: _u, ...rest } = profile.data;
  return <Form initial={rest} />;
}

function Form({ initial }: { initial: ProfileForm }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<ProfileForm>({
    ...initial,
    contact_email: initial.contact_email ?? '',
    contact_phone: initial.contact_phone ?? '',
    linkedin_url: initial.linkedin_url ?? '',
    x_url: initial.x_url ?? '',
  });
  const [saved, setSaved] = useState(() => JSON.stringify(form));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const isDirty = JSON.stringify(form) !== saved;
  const blocker = useBlocker(({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => { document.title = 'Perfil y web — Panel'; }, []);

  const set = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const res = schema.safeParse(form);
    if (!res.success) {
      setErrors(Object.fromEntries(res.error.issues.map((i) => [i.path.join('.'), i.message])));
      toast.error('Revisa los campos marcados.');
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const updated = await updateProfile({
        ...form,
        contact_email: form.contact_email?.trim() || null,
        contact_phone: form.contact_phone?.trim() || null,
        linkedin_url: form.linkedin_url?.trim() || null,
        x_url: form.x_url?.trim() || null,
        research_lines: form.research_lines.map((l) => ({ title: l.title.trim(), description: l.description.trim() })),
      });
      qc.setQueryData(queryKeys.profile, updated);
      setSaved(JSON.stringify(form));
      toast.success('Perfil actualizado. Los cambios ya están en la web.');
    } catch (err) {
      toast.error(toAppError(err).message);
    } finally {
      setSaving(false);
    }
  }

  const lines = form.research_lines;
  const setLine = (i: number, patch: Partial<(typeof lines)[number]>) =>
    set('research_lines', lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const moveLine = (i: number, dir: -1 | 1) => {
    const next = [...lines];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    set('research_lines', next);
  };

  const err = (k: string) => errors[k] && <p className={styles.fieldError}>{errors[k]}</p>;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Perfil y web</h1>
          <p className={styles.pageSubtitle}>Textos de la página de inicio y de «Sobre mí». Las secciones vacías no se muestran.</p>
        </div>
      </header>

      <form className={styles.formGrid} onSubmit={submit} noValidate>
        <section className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Página de inicio</h2>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="headline">Descripción profesional</label>
            <input id="headline" className={`${styles.input} ${errors.headline ? styles.invalid : ''}`} value={form.headline} onChange={(e) => set('headline', e.target.value)} />
            {err('headline') || <p className={styles.fieldHint}>Aparece sobre la frase principal y en «Sobre mí».</p>}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="home_intro">Frase principal <span className={styles.fieldCount}>{form.home_intro.length}/240</span></label>
            <textarea id="home_intro" rows={3} className={`${styles.textarea} ${errors.home_intro ? styles.invalid : ''}`} value={form.home_intro} onChange={(e) => set('home_intro', e.target.value)} />
            {err('home_intro') || <p className={styles.fieldHint}>El gran titular de la portada: qué investigas, en una frase.</p>}
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="home_about">Presentación breve <span className={styles.fieldCount}>{form.home_about.length}/700</span></label>
            <textarea id="home_about" rows={4} className={styles.textarea} value={form.home_about} onChange={(e) => set('home_about', e.target.value)} />
            {err('home_about') || <p className={styles.fieldHint}>Sección «Sobre la autora» de la portada.</p>}
          </div>
        </section>

        <section className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Sobre mí</h2>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Presentación personal</span>
            <RichTextEditor compact value={form.about_intro} onChange={(v) => set('about_intro', v)} placeholder="Quién eres y qué haces." />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Perfil investigador</span>
            <RichTextEditor compact value={form.research_profile} onChange={(v) => set('research_profile', v)} placeholder="Enfoque, preguntas de investigación, metodología…" />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Vinculación con el Instituto Franklin</span>
            <RichTextEditor compact value={form.franklin} onChange={(v) => set('franklin', v)} placeholder="Beca, proyecto, área de trabajo…" />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Trayectoria académica y profesional</span>
            <RichTextEditor compact value={form.trajectory} onChange={(v) => set('trajectory', v)} placeholder="Formación, experiencia, publicaciones… (puedes usar listas)" />
            <p className={styles.fieldHint}>Mientras esté vacía, esta sección no aparece en la web.</p>
          </div>
        </section>

        <section className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Líneas de investigación</h2>
          {lines.map((l, i) => (
            <div key={i} className={styles.lineEditor}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor={`line-t-${i}`}>Título</label>
                <input id={`line-t-${i}`} className={`${styles.input} ${errors[`research_lines.${i}.title`] ? styles.invalid : ''}`} value={l.title} onChange={(e) => setLine(i, { title: e.target.value })} />
                {err(`research_lines.${i}.title`)}
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor={`line-d-${i}`}>Descripción</label>
                <textarea id={`line-d-${i}`} rows={2} className={styles.textarea} style={{ minHeight: '3.5rem' }} value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} />
              </div>
              <div className={styles.lineEditorActions}>
                <button type="button" className={styles.iconButton} disabled={i === 0} onClick={() => moveLine(i, -1)} aria-label="Subir"><Icon icon={faArrowUp} /></button>
                <button type="button" className={styles.iconButton} disabled={i === lines.length - 1} onClick={() => moveLine(i, 1)} aria-label="Bajar"><Icon icon={faArrowDown} /></button>
                <button type="button" className={`${styles.iconButton} ${styles.dangerIcon}`} onClick={() => set('research_lines', lines.filter((_, j) => j !== i))} aria-label="Eliminar línea"><Icon icon={faTrashCan} /></button>
              </div>
            </div>
          ))}
          <Button size="sm" onClick={() => set('research_lines', [...lines, { title: '', description: '' }])} style={{ justifySelf: 'start' }}>
            <Icon icon={faPlus} /> Añadir línea
          </Button>
        </section>

        <section className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Contacto</h2>
          <div className={styles.twoFields}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="email">Email de contacto</label>
              <input id="email" type="email" className={`${styles.input} ${errors.contact_email ? styles.invalid : ''}`} value={form.contact_email ?? ''} onChange={(e) => set('contact_email', e.target.value)} />
              {err('contact_email') || <p className={styles.fieldHint}>Será visible públicamente.</p>}
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="phone">Teléfono</label>
              <input id="phone" type="tel" placeholder="+34 600 000 000" className={`${styles.input} ${errors.contact_phone ? styles.invalid : ''}`} value={form.contact_phone ?? ''} onChange={(e) => set('contact_phone', e.target.value)} />
              {err('contact_phone') || <p className={styles.fieldHint}>Visible en la página de contacto.</p>}
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="location">Ubicación</label>
              <input id="location" className={styles.input} value={form.location} onChange={(e) => set('location', e.target.value)} />
              {err('location')}
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="linkedin">LinkedIn</label>
              <input id="linkedin" type="url" placeholder="https://www.linkedin.com/in/…" className={`${styles.input} ${errors.linkedin_url ? styles.invalid : ''}`} value={form.linkedin_url ?? ''} onChange={(e) => set('linkedin_url', e.target.value)} />
              {err('linkedin_url')}
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="x">X</label>
              <input id="x" type="url" placeholder="https://x.com/…" className={`${styles.input} ${errors.x_url ? styles.invalid : ''}`} value={form.x_url ?? ''} onChange={(e) => set('x_url', e.target.value)} />
              {err('x_url')}
            </div>
          </div>
        </section>

        <div className={styles.stickySave}>
          {isDirty && <span className={`${styles.saveState} ${styles.saveStateDirty}`} style={{ alignSelf: 'center' }}>Cambios sin guardar</span>}
          <Button type="submit" variant="primary" loading={saving} disabled={!isDirty}>Guardar cambios</Button>
        </div>
      </form>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Tienes cambios sin guardar"
        confirmLabel="Salir sin guardar"
        danger
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      >
        <p>Si sales ahora, perderás los cambios.</p>
      </ConfirmDialog>
    </div>
  );
}

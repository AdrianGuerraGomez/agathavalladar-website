import { faArrowDown, faArrowUp, faCheck, faPen, faPlus, faTrashCan, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Icon } from '@/components/ui/Icon';
import { PageLoader } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { queryKeys, useAdminArticles, useCategories } from '@/hooks/queries';
import { SLUG_PATTERN, slugify } from '@/lib/slug';
import { createCategory, deleteCategory, updateCategory, type CategoryInput } from '@/services/categories';
import type { Category } from '@/types/content';
import styles from '../admin.module.css';

const schema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(80, 'Máximo 80 caracteres.'),
  slug: z.string().regex(SLUG_PATTERN, 'Solo minúsculas, números y guiones.'),
  description: z.string().max(400, 'Máximo 400 caracteres.'),
});

interface Draft { name: string; slug: string; description: string; slugTouched: boolean }
const emptyDraft: Draft = { name: '', slug: '', description: '', slugTouched: false };

function CategoryForm({ initial, submitLabel, onSubmit, onCancel, busy }: {
  initial: Draft;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (d: Omit<CategoryInput, 'sort_order'>) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const [d, setD] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    const res = schema.safeParse(d);
    if (!res.success) {
      setErrors(Object.fromEntries(res.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrors({});
    const ok = await onSubmit({ name: res.data.name, slug: res.data.slug, description: res.data.description.trim() || null });
    if (ok && !onCancel) setD(emptyDraft);
  }

  return (
    <form onSubmit={submit} className={styles.panel} noValidate>
      <div className={styles.twoFields}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor={`cat-name-${initial.slug}`}>Nombre</label>
          <input
            id={`cat-name-${initial.slug}`}
            className={`${styles.input} ${errors.name ? styles.invalid : ''}`}
            value={d.name}
            onChange={(e) => setD({ ...d, name: e.target.value, slug: d.slugTouched ? d.slug : slugify(e.target.value) })}
            placeholder="Por ejemplo: Seguridad y defensa"
          />
          {errors.name && <p className={styles.fieldError}>{errors.name}</p>}
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor={`cat-slug-${initial.slug}`}>URL</label>
          <input
            id={`cat-slug-${initial.slug}`}
            className={`${styles.input} ${errors.slug ? styles.invalid : ''}`}
            value={d.slug}
            onChange={(e) => setD({ ...d, slug: e.target.value.toLowerCase(), slugTouched: true })}
            onBlur={() => setD((x) => ({ ...x, slug: slugify(x.slug) }))}
          />
          {errors.slug ? <p className={styles.fieldError}>{errors.slug}</p> : <p className={styles.fieldHint}>/publicaciones?categoria={d.slug || '…'}</p>}
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor={`cat-desc-${initial.slug}`}>Descripción <span className={styles.fieldCount}>opcional</span></label>
        <input id={`cat-desc-${initial.slug}`} className={styles.input} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} placeholder="Se muestra en la cabecera del archivo filtrado" />
        {errors.description && <p className={styles.fieldError}>{errors.description}</p>}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        {onCancel && <Button variant="ghost" size="sm" onClick={onCancel}><Icon icon={faXmark} /> Cancelar</Button>}
        <Button type="submit" variant="primary" size="sm" loading={busy}>
          <Icon icon={onCancel ? faCheck : faPlus} /> {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default function Categories() {
  const toast = useToast();
  const qc = useQueryClient();
  const categories = useCategories();
  const articles = useAdminArticles();
  const [editing, setEditing] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  useEffect(() => { document.title = 'Categorías — Panel'; }, []);

  const usage = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of articles.data ?? []) if (a.category_id) m.set(a.category_id, (m.get(a.category_id) ?? 0) + 1);
    return m;
  }, [articles.data]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: queryKeys.categories });
    qc.invalidateQueries({ queryKey: queryKeys.articles });
  };

  const create = useMutation({
    mutationFn: (d: Omit<CategoryInput, 'sort_order'>) =>
      createCategory({ ...d, sort_order: ((categories.data ?? []).at(-1)?.sort_order ?? 0) + 10 }),
    onSuccess: (c) => { toast.success(`Categoría «${c.name}» creada.`); refresh(); },
    onError: (e) => toast.error(e.message),
  });

  const edit = useMutation({
    mutationFn: ({ id, d }: { id: string; d: Partial<CategoryInput> }) => updateCategory(id, d),
    onSuccess: () => { refresh(); },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (c: Category) => deleteCategory(c.id),
    onSuccess: () => { toast.success('Categoría eliminada.'); setToDelete(null); refresh(); },
    onError: (e) => { toast.error(e.message); setToDelete(null); },
  });

  async function move(index: number, dir: -1 | 1) {
    const list = categories.data ?? [];
    const a = list[index];
    const b = list[index + dir];
    if (!a || !b) return;
    // Intercambia posiciones (normaliza a múltiplos de 10).
    const aOrder = (index + dir + 1) * 10;
    const bOrder = (index + 1) * 10;
    await Promise.all([edit.mutateAsync({ id: a.id, d: { sort_order: aOrder } }), edit.mutateAsync({ id: b.id, d: { sort_order: bOrder } })]);
  }

  if (categories.isPending) return <PageLoader />;
  if (categories.isError) return <div className={styles.page}><ErrorState error={categories.error} onRetry={() => categories.refetch()} /></div>;

  const list = categories.data;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Categorías</h1>
          <p className={styles.pageSubtitle}>Temáticas para organizar y filtrar tus artículos. El orden se refleja en la web.</p>
        </div>
      </header>

      <div className={styles.formGrid}>
        <section className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Nueva categoría</h2>
          <CategoryForm
            initial={emptyDraft}
            submitLabel="Crear categoría"
            busy={create.isPending}
            onSubmit={async (d) => { try { await create.mutateAsync(d); return true; } catch { return false; } }}
          />
        </section>

        <section className={styles.formSection}>
          <h2 className={styles.formSectionTitle}>Categorías existentes</h2>
          <div className={styles.catList}>
            {list.map((c, i) =>
              editing === c.id ? (
                <div key={c.id} style={{ padding: '0.75rem 0' }}>
                  <CategoryForm
                    initial={{ name: c.name, slug: c.slug, description: c.description ?? '', slugTouched: true }}
                    submitLabel="Guardar"
                    busy={edit.isPending}
                    onCancel={() => setEditing(null)}
                    onSubmit={async (d) => {
                      try {
                        await edit.mutateAsync({ id: c.id, d });
                        toast.success('Categoría actualizada.');
                        setEditing(null);
                        return true;
                      } catch { return false; }
                    }}
                  />
                </div>
              ) : (
                <div key={c.id} className={styles.catRow}>
                  <div>
                    <p className={styles.titleLink}>{c.name}</p>
                    {c.description && <p className={styles.slug}>{c.description}</p>}
                  </div>
                  <span className={styles.slug}>/{c.slug}</span>
                  <span className={styles.catCount}>{usage.get(c.id) ?? 0} artículos</span>
                  <div className={styles.rowActions}>
                    <button type="button" className={styles.iconButton} onClick={() => move(i, -1)} disabled={i === 0 || edit.isPending} aria-label={`Subir ${c.name}`}><Icon icon={faArrowUp} /></button>
                    <button type="button" className={styles.iconButton} onClick={() => move(i, 1)} disabled={i === list.length - 1 || edit.isPending} aria-label={`Bajar ${c.name}`}><Icon icon={faArrowDown} /></button>
                    <button type="button" className={styles.iconButton} onClick={() => setEditing(c.id)} aria-label={`Editar ${c.name}`}><Icon icon={faPen} /></button>
                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.dangerIcon}`}
                      onClick={() => setToDelete(c)}
                      disabled={(usage.get(c.id) ?? 0) > 0}
                      title={(usage.get(c.id) ?? 0) > 0 ? 'No se puede eliminar: tiene artículos asignados' : 'Eliminar'}
                      aria-label={`Eliminar ${c.name}`}
                    >
                      <Icon icon={faTrashCan} />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title={`¿Eliminar «${toDelete?.name}»?`}
        confirmLabel="Eliminar"
        danger
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      >
        <p>Los enlaces a esta categoría dejarán de funcionar.</p>
      </ConfirmDialog>
    </div>
  );
}

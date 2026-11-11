import { faEnvelope, faEnvelopeOpen, faReply, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Icon } from '@/components/ui/Icon';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatDateShort, formatTime } from '@/lib/format';
import { deleteContactMessage, listContactMessages, setMessageRead } from '@/services/contact';
import type { ContactMessage } from '@/types/content';
import styles from '../admin.module.css';
import local from './Messages.module.css';

export const MESSAGES_KEY = ['contact-messages'] as const;

export default function Messages() {
  const toast = useToast();
  const qc = useQueryClient();
  const messages = useQuery({ queryKey: MESSAGES_KEY, queryFn: listContactMessages, refetchOnWindowFocus: true });
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ContactMessage | null>(null);

  useEffect(() => { document.title = 'Mensajes — Panel'; }, []);

  const unread = (messages.data ?? []).filter((m) => !m.read).length;
  const list = useMemo(
    () => (messages.data ?? []).filter((m) => filter === 'all' || !m.read),
    [messages.data, filter],
  );

  const mark = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => setMessageRead(id, read),
    onSuccess: () => qc.invalidateQueries({ queryKey: MESSAGES_KEY }),
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (m: ContactMessage) => deleteContactMessage(m.id),
    onSuccess: () => {
      toast.success('Mensaje eliminado.');
      setToDelete(null);
      qc.invalidateQueries({ queryKey: MESSAGES_KEY });
    },
    onError: (e) => toast.error(e.message),
  });

  function toggle(m: ContactMessage) {
    const opening = openId !== m.id;
    setOpenId(opening ? m.id : null);
    if (opening && !m.read) mark.mutate({ id: m.id, read: true });
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Mensajes</h1>
          <p className={styles.pageSubtitle}>Lo que llega desde el formulario de contacto de la web.</p>
        </div>
      </header>

      <div className={styles.stats} role="group" aria-label="Filtrar mensajes">
        <button type="button" className={`${styles.statButton} ${filter === 'all' ? styles.statButtonActive : ''}`} onClick={() => setFilter('all')} aria-pressed={filter === 'all'}>
          Todos <span className={styles.statCount}>{messages.data?.length ?? 0}</span>
        </button>
        <button type="button" className={`${styles.statButton} ${filter === 'unread' ? styles.statButtonActive : ''}`} onClick={() => setFilter('unread')} aria-pressed={filter === 'unread'}>
          Sin leer <span className={styles.statCount}>{unread}</span>
        </button>
      </div>

      {messages.isPending ? (
        <PageLoader />
      ) : messages.isError ? (
        <ErrorState error={messages.error} onRetry={() => messages.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState title={filter === 'unread' ? 'No hay mensajes sin leer.' : 'Todavía no has recibido mensajes.'} />
      ) : (
        <ul role="list" className={local.list}>
          {list.map((m) => {
            const open = openId === m.id;
            return (
              <li key={m.id} className={`${local.item} ${m.read ? '' : local.unread}`}>
                <button type="button" className={local.summary} onClick={() => toggle(m)} aria-expanded={open}>
                  <span className={local.dot} aria-label={m.read ? undefined : 'Sin leer'} />
                  <span className={local.from}>
                    <strong>{m.name}</strong>
                    <span>{m.email}</span>
                  </span>
                  <span className={local.subject}>{m.subject || m.message.slice(0, 90)}</span>
                  <span className={`${local.date} tabular`}>{formatDateShort(m.created_at)} · {formatTime(m.created_at)}</span>
                </button>
                {open && (
                  <div className={local.body}>
                    {m.subject && <p className={local.bodySubject}>{m.subject}</p>}
                    <p className={local.bodyText}>{m.message}</p>
                    <div className={local.actions}>
                      <a
                        className={local.reply}
                        href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'Tu mensaje'}`)}`}
                      >
                        <Icon icon={faReply} /> Responder por email
                      </a>
                      <button type="button" className={styles.iconButton} onClick={() => mark.mutate({ id: m.id, read: !m.read })} title={m.read ? 'Marcar como no leído' : 'Marcar como leído'} aria-label={m.read ? 'Marcar como no leído' : 'Marcar como leído'}>
                        <Icon icon={m.read ? faEnvelope : faEnvelopeOpen} />
                      </button>
                      <button type="button" className={`${styles.iconButton} ${styles.dangerIcon}`} onClick={() => setToDelete(m)} aria-label="Eliminar mensaje" title="Eliminar">
                        <Icon icon={faTrashCan} />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="¿Eliminar este mensaje?"
        confirmLabel="Eliminar"
        danger
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      >
        <p>El mensaje de {toDelete?.name} se eliminará de forma permanente.</p>
      </ConfirmDialog>
    </div>
  );
}

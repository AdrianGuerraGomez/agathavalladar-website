import { faArrowsRotate, faImage, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useId, useRef, useState, type DragEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ACCEPTED_IMAGE_TYPES, MAX_INPUT_BYTES } from '@/lib/images';
import type { ImageDraft } from '../imageDraft';
import styles from '../admin.module.css';
import local from './ImageField.module.css';

interface Props {
  label: string;
  hint?: string;
  value: ImageDraft | null;
  onChange: (value: ImageDraft | null) => void;
  error?: string;
  altError?: string;
}

/** Selector de imagen: arrastrar o elegir, previsualizar, sustituir, quitar, texto alternativo y pie. */
export function ImageField({ label, hint, value, onChange, error, altError }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Libera las URL temporales de previsualización.
  useEffect(() => {
    const url = value?.previewUrl;
    return () => {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [value?.previewUrl]);

  function pick(file: File | undefined) {
    if (!file) return;
    setLocalError(null);
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setLocalError('Formato no admitido. Usa JPG, PNG, WebP o AVIF.');
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setLocalError('La imagen supera los 25 MB.');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      onChange({
        path: null,
        file,
        previewUrl,
        alt: value?.alt ?? '',
        caption: value?.caption ?? '',
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      setLocalError('No se pudo leer la imagen.');
    };
    img.src = previewUrl;
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  }

  const shownError = localError ?? error;

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel} id={`${id}-label`}>{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {value?.previewUrl ? (
        <div className={local.preview}>
          <img src={value.previewUrl} alt="" className={local.previewImg} />
          <div className={local.previewActions}>
            <button type="button" className={local.action} onClick={() => inputRef.current?.click()}>
              <Icon icon={faArrowsRotate} /> Sustituir
            </button>
            <button type="button" className={`${local.action} ${local.actionDanger}`} onClick={() => onChange(null)}>
              <Icon icon={faTrashCan} /> Quitar
            </button>
          </div>
          {value.file && <p className={local.pending}>Se subirá al guardar · se optimizará automáticamente</p>}
        </div>
      ) : (
        <button
          type="button"
          className={`${local.drop} ${dragging ? local.dropActive : ''} ${shownError ? local.dropInvalid : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          aria-labelledby={`${id}-label`}
          aria-describedby={hint ? `${id}-hint` : undefined}
        >
          <Icon icon={faImage} className={local.dropIcon} />
          <span className={local.dropText}>Arrastra una imagen o <u>elígela</u></span>
          <span className={local.dropHint}>JPG, PNG, WebP · máx. 25 MB</span>
        </button>
      )}
      {hint && <p id={`${id}-hint`} className={styles.fieldHint}>{hint}</p>}
      {shownError && <p className={styles.fieldError} role="alert">{shownError}</p>}

      {value && (
        <div className={local.meta}>
          <div className={styles.field}>
            <label htmlFor={`${id}-alt`} className={styles.fieldLabel}>
              Texto alternativo
              <span className={styles.fieldCount}>{value.alt.length}/200</span>
            </label>
            <input
              id={`${id}-alt`}
              className={`${styles.input} ${altError ? styles.invalid : ''}`}
              value={value.alt}
              maxLength={200}
              placeholder="Describe brevemente la imagen"
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
            />
            {altError ? <p className={styles.fieldError}>{altError}</p> : <p className={styles.fieldHint}>Para lectores de pantalla y buscadores.</p>}
          </div>
          <div className={styles.field}>
            <label htmlFor={`${id}-caption`} className={styles.fieldLabel}>Pie de foto <span className={styles.fieldCount}>opcional</span></label>
            <input
              id={`${id}-caption`}
              className={styles.input}
              value={value.caption}
              maxLength={300}
              placeholder="Fuente, autoría o contexto"
              onChange={(e) => onChange({ ...value, caption: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

import {
  faArrowRotateLeft,
  faArrowRotateRight,
  faBold,
  faEraser,
  faItalic,
  faLink,
  faLinkSlash,
  faListOl,
  faListUl,
  faMinus,
  faQuoteLeft,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useRef, useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { wordCount } from '@/lib/format';
import styles from './RichTextEditor.module.css';

interface Props {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  invalid?: boolean;
  compact?: boolean;
  describedBy?: string;
}

function renameElement(el: Element, tag: string) {
  const next = el.ownerDocument.createElement(tag);
  while (el.firstChild) next.appendChild(el.firstChild);
  el.replaceWith(next);
}

function unwrap(el: Element) {
  el.replaceWith(...Array.from(el.childNodes));
}

/**
 * Normaliza el HTML pegado desde Word, Google Docs o webs:
 * convierte negritas/cursivas hechas con estilos en etiquetas semánticas,
 * elimina el envoltorio <b style="font-weight:normal"> de Google Docs,
 * ajusta la jerarquía de encabezados y descarta estilos y clases.
 */
function cleanPastedHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('meta, style, script, link, title, o\\:p').forEach((el) => el.remove());

  // Google Docs envuelve todo en <b style="font-weight:normal" id="docs-internal-guid-…">.
  doc.querySelectorAll('b').forEach((b) => {
    const style = b.getAttribute('style') ?? '';
    if (/font-weight:\s*(normal|400)/i.test(style) || b.id.startsWith('docs-internal-guid')) unwrap(b);
  });

  // Estilos en línea → etiquetas semánticas (de dentro hacia fuera).
  Array.from(doc.querySelectorAll('span[style], font')).reverse().forEach((span) => {
    const style = span.getAttribute('style') ?? '';
    const bold = /font-weight:\s*(bold|[6-9]00)/i.test(style);
    const italic = /font-style:\s*italic/i.test(style);
    let node: Element | null = null;
    if (bold || italic) {
      node = doc.createElement(bold ? 'strong' : 'em');
      let inner = node;
      if (bold && italic) {
        inner = doc.createElement('em');
        node.appendChild(inner);
      }
      while (span.firstChild) inner.appendChild(span.firstChild);
      span.replaceWith(node);
    } else {
      unwrap(span);
    }
  });

  doc.querySelectorAll('h1').forEach((h) => renameElement(h, 'h2'));
  doc.querySelectorAll('h4, h5, h6').forEach((h) => renameElement(h, 'h3'));
  doc.querySelectorAll('[style], [class], [id], [dir], [lang]').forEach((el) => {
    ['style', 'class', 'id', 'dir', 'lang'].forEach((a) => el.removeAttribute(a));
  });
  return doc.body.innerHTML;
}

function ToolbarButton({ label, icon, active, disabled, onClick }: { label: string; icon: IconDefinition; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`${styles.tool} ${active ? styles.toolActive : ''}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      <Icon icon={icon} />
    </button>
  );
}

function LinkForm({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const initial = (editor.getAttributes('link').href as string | undefined) ?? '';
  const [url, setUrl] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);

  function apply(e: FormEvent) {
    e.preventDefault();
    const value = url.trim();
    if (!value) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const href = /^(https?:|mailto:|\/|#)/i.test(value) ? value : `https://${value}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    onClose();
  }

  return (
    <form className={styles.linkForm} onSubmit={apply}>
      <label htmlFor="link-url" className="visually-hidden">Dirección del enlace</label>
      <input
        id="link-url"
        ref={inputRef}
        autoFocus
        type="text"
        inputMode="url"
        placeholder="https://…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && (e.preventDefault(), onClose(), editor.commands.focus())}
        className={styles.linkInput}
      />
      <button type="submit" className={styles.linkApply}>Aplicar</button>
      <button type="button" className={styles.linkCancel} onClick={() => { onClose(); editor.commands.focus(); }}>Cancelar</button>
    </form>
  );
}

/**
 * Editor visual del cuerpo. Admite párrafos, subtítulos, negrita, cursiva,
 * enlaces, listas, citas y separadores. Guarda HTML semántico.
 */
export function RichTextEditor({ id, value, onChange, placeholder = 'Escribe o pega aquí el texto…', invalid, compact, describedBy }: Props) {
  const [linkOpen, setLinkOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https', HTMLAttributes: { rel: 'noopener noreferrer', target: null } },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `prose ${styles.content}`,
        ...(id ? { id } : {}),
        'aria-multiline': 'true',
        role: 'textbox',
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      },
      transformPastedHTML: cleanPastedHtml,
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            block: e.isActive('heading', { level: 2 }) ? 'h2' : e.isActive('heading', { level: 3 }) ? 'h3' : 'p',
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            link: e.isActive('link'),
            bullet: e.isActive('bulletList'),
            ordered: e.isActive('orderedList'),
            quote: e.isActive('blockquote'),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
            words: wordCount(e.getHTML()),
          }
        : null,
  });

  if (!editor || !state) return <div className={`${styles.wrapper} ${styles.loading}`} />;

  const setBlock = (v: string) => {
    const chain = editor.chain().focus();
    if (v === 'p') chain.setParagraph().run();
    else chain.setHeading({ level: v === 'h2' ? 2 : 3 }).run();
  };

  return (
    <div className={`${styles.wrapper} ${invalid ? styles.invalid : ''} ${compact ? styles.compact : ''}`}>
      <div className={styles.toolbar} role="toolbar" aria-label="Formato del texto">
        <label className="visually-hidden" htmlFor={`${id ?? 'rte'}-block`}>Tipo de bloque</label>
        <select id={`${id ?? 'rte'}-block`} className={styles.blockSelect} value={state.block} onChange={(e) => setBlock(e.target.value)}>
          <option value="p">Párrafo</option>
          <option value="h2">Subtítulo</option>
          <option value="h3">Subtítulo menor</option>
        </select>
        <span className={styles.sep} />
        <ToolbarButton label="Negrita (Ctrl+B)" icon={faBold} active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolbarButton label="Cursiva (Ctrl+I)" icon={faItalic} active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolbarButton label="Enlace" icon={faLink} active={state.link || linkOpen} onClick={() => setLinkOpen((o) => !o)} />
        {state.link && <ToolbarButton label="Quitar enlace" icon={faLinkSlash} onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()} />}
        <span className={styles.sep} />
        <ToolbarButton label="Lista con viñetas" icon={faListUl} active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolbarButton label="Lista numerada" icon={faListOl} active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <ToolbarButton label="Cita" icon={faQuoteLeft} active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        {!compact && <ToolbarButton label="Separador de sección" icon={faMinus} onClick={() => editor.chain().focus().setHorizontalRule().run()} />}
        <span className={styles.sep} />
        <ToolbarButton label="Quitar formato" icon={faEraser} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} />
        <span className={styles.spacer} />
        <ToolbarButton label="Deshacer (Ctrl+Z)" icon={faArrowRotateLeft} disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()} />
        <ToolbarButton label="Rehacer" icon={faArrowRotateRight} disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()} />
      </div>
      {linkOpen && <LinkForm editor={editor} onClose={() => setLinkOpen(false)} />}
      <EditorContent editor={editor} />
      {!compact && (
        <div className={styles.footer}>
          <span className="tabular">{state.words.toLocaleString('es-ES')} palabras · {Math.max(1, Math.round(state.words / 220))} min de lectura</span>
          <span>Puedes pegar directamente desde Word o Google Docs.</span>
        </div>
      )}
    </div>
  );
}

import React, { useRef, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Bold, Italic, Underline, Minus } from 'lucide-react';
import { useResumeStore } from '../../../store/resumeStore';

// ─── Sanitizer ────────────────────────────────────────────────────────────────
const SAFE_TAGS = new Set(['b', 'i', 'u', 's', 'sub', 'sup', 'strong', 'em']);

function sanitizeNode(node: Node): void {
  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const child = node.childNodes[i];
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as Element;
    const tag = el.tagName.toLowerCase();
    sanitizeNode(el); // recurse first
    if (!SAFE_TAGS.has(tag)) {
      // unwrap: replace element with its children
      while (el.firstChild) node.insertBefore(el.firstChild, el);
      node.removeChild(el);
    } else {
      // remove all attributes from safe tags
      while (el.attributes.length > 0) el.removeAttribute(el.attributes[0].name);
      // normalize strong→b, em→i
      const newTag = tag === 'strong' ? 'b' : tag === 'em' ? 'i' : null;
      if (newTag) {
        const replacement = document.createElement(newTag);
        while (el.firstChild) replacement.appendChild(el.firstChild);
        el.replaceWith(replacement);
      }
    }
  }
}

function sanitize(html: string): string {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  sanitizeNode(tmp);
  return tmp.innerHTML.replace(/<(b|i|u|s|sub|sup)><\/\1>/g, '');
}

// ─── EditableField ─────────────────────────────────────────────────────────────
interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  style?: CSSProperties;
  className?: string;
  onEnter?: () => void;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  value, onChange, placeholder = 'Click to edit', multiline = false, style, className, onEnter,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  // Tracks when user is pressing down on the toolbar — prevents blur from closing it
  const toolbarDown = useRef(false);

  // Sync content from store whenever we're not editing
  useEffect(() => {
    if (ref.current && !editing) {
      ref.current.innerHTML = value || '';
    }
  }, [value, editing]);

  // Move cursor to end when editing starts
  useEffect(() => {
    if (!editing || !ref.current) return;
    ref.current.focus({ preventScroll: true });
    try {
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch { /* noop */ }
  }, [editing]);

  const startEdit = () => { if (!editing) setEditing(true); };

  const handleBlur = (e: React.FocusEvent) => {
    // If user is clicking on the toolbar, defer — the toolbar pointerdown already fired
    if (toolbarDown.current) {
      // Re-focus the field so user can apply formatting
      setTimeout(() => ref.current?.focus({ preventScroll: true }), 0);
      return;
    }
    const related = e.relatedTarget as HTMLElement | null;
    if (related?.closest?.('[data-fmt-toolbar]')) return;
    commitAndClose();
  };

  const commitAndClose = () => {
    setEditing(false);
    if (!ref.current) return;
    const newVal = sanitize(ref.current.innerHTML);
    if (newVal !== value) onChange(newVal || value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      ref.current?.blur();
      onEnter?.();
    }
    if (e.key === 'Escape') {
      if (ref.current) ref.current.innerHTML = value;
      ref.current?.blur();
    }
  };

  const fmt = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val ?? undefined);
    toolbarDown.current = false;
    ref.current?.focus({ preventScroll: true });
  };

  const handleToolbarPointerDown = (e: React.PointerEvent) => {
    e.preventDefault(); // prevent blur on the contenteditable
    toolbarDown.current = true;
    // Clear flag after the click event fires
    requestAnimationFrame(() => { toolbarDown.current = false; });
  };

  return (
    <span style={{ position: 'relative', display: style?.display ?? 'inline' }}>
      {editing && (
        <Toolbar onPointerDown={handleToolbarPointerDown}>
          <TBtn onPointerDown={() => fmt('bold')} title="Bold (Ctrl+B)"><Bold size={11} /></TBtn>
          <TBtn onPointerDown={() => fmt('italic')} title="Italic (Ctrl+I)"><Italic size={11} /></TBtn>
          <TBtn onPointerDown={() => fmt('underline')} title="Underline (Ctrl+U)"><Underline size={11} /></TBtn>
          <Sep />
          <TBtn onPointerDown={() => fmt('strikeThrough')} title="Strikethrough">
            <span style={{ fontSize: 11, fontWeight: 700, textDecoration: 'line-through', fontFamily: 'sans-serif' }}>S</span>
          </TBtn>
          <TBtn onPointerDown={() => fmt('subscript')} title="Subscript">
            <span style={{ fontFamily: 'sans-serif', fontSize: 10 }}>x<sub style={{ fontSize: 7 }}>2</sub></span>
          </TBtn>
          <TBtn onPointerDown={() => fmt('superscript')} title="Superscript">
            <span style={{ fontFamily: 'sans-serif', fontSize: 10 }}>x<sup style={{ fontSize: 7 }}>2</sup></span>
          </TBtn>
          <Sep />
          <TBtn onPointerDown={() => fmt('removeFormat')} title="Clear formatting">
            <span style={{ fontFamily: 'sans-serif', fontSize: 10, letterSpacing: '-0.5px' }}>T<sub style={{ fontSize: 7, textDecoration: 'line-through' }}>x</sub></span>
          </TBtn>
        </Toolbar>
      )}
      <div
        ref={ref}
        className={`editable-field ${className ?? ''}`}
        style={{ ...style, display: style?.display ?? 'inline', minWidth: 20, outline: 'none' }}
        contentEditable={editing}
        suppressContentEditableWarning
        onClick={startEdit}
        onFocus={startEdit}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        spellCheck={editing}
      />
    </span>
  );
};

// ─── EditableBullet ────────────────────────────────────────────────────────────
interface BulletProps {
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  accentColor: string;
  isPrinting: boolean;
  onAddNext?: () => void;
}

export const EditableBullet: React.FC<BulletProps> = ({
  value, onChange, onRemove, accentColor, isPrinting, onAddNext,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const bulletChar = useResumeStore(s => s.resume.settings.bulletStyle ?? '•');
  const toolbarDown = useRef(false);

  useEffect(() => {
    if (ref.current && !editing) ref.current.innerHTML = value;
  }, [value, editing]);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus({ preventScroll: true });
  }, [editing]);

  const handleBlur = (e: React.FocusEvent) => {
    if (toolbarDown.current) {
      setTimeout(() => ref.current?.focus({ preventScroll: true }), 0);
      return;
    }
    const related = e.relatedTarget as HTMLElement | null;
    if (related?.closest?.('[data-fmt-toolbar]')) return;
    setEditing(false);
    if (!ref.current) return;
    const newVal = sanitize(ref.current.innerHTML);
    if (newVal !== value) onChange(newVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); ref.current?.blur(); onAddNext?.(); }
    if (e.key === 'Escape') { if (ref.current) ref.current.innerHTML = value; ref.current?.blur(); }
    if (e.key === 'Backspace' && ref.current?.textContent === '') { e.preventDefault(); onRemove(); }
  };

  const fmt = (cmd: string) => {
    document.execCommand(cmd, false);
    toolbarDown.current = false;
    ref.current?.focus({ preventScroll: true });
  };

  const handleToolbarPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    toolbarDown.current = true;
    requestAnimationFrame(() => { toolbarDown.current = false; });
  };

  return (
    <div
      className="group"
      style={{ display: 'flex', alignItems: 'flex-start', gap: 6, margin: '2px 0', paddingLeft: 2, position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {editing && (
        <Toolbar onPointerDown={handleToolbarPointerDown}>
          <TBtn onPointerDown={() => fmt('bold')} title="Bold"><Bold size={11} /></TBtn>
          <TBtn onPointerDown={() => fmt('italic')} title="Italic"><Italic size={11} /></TBtn>
          <TBtn onPointerDown={() => fmt('underline')} title="Underline"><Underline size={11} /></TBtn>
          <Sep />
          <TBtn onPointerDown={() => fmt('strikeThrough')} title="Strikethrough">
            <span style={{ fontSize: 11, fontWeight: 700, textDecoration: 'line-through', fontFamily: 'sans-serif' }}>S</span>
          </TBtn>
          <TBtn onPointerDown={() => fmt('removeFormat')} title="Clear formatting">
            <span style={{ fontFamily: 'sans-serif', fontSize: 10 }}>Tx</span>
          </TBtn>
        </Toolbar>
      )}
      <span style={{ color: accentColor, fontWeight: 700, marginTop: 2, flexShrink: 0, fontSize: '1.1em', lineHeight: 1 }}>
        {bulletChar || '•'}
      </span>
      <div
        ref={ref}
        className="editable-block"
        style={{ flex: 1, outline: 'none' }}
        contentEditable={editing}
        suppressContentEditableWarning
        onClick={() => !editing && setEditing(true)}
        onFocus={() => !editing && setEditing(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        spellCheck={editing}
      />
      {!isPrinting && hovered && (
        <button
          onClick={onRemove}
          className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '1px 3px', marginTop: 1 }}
        >
          <Minus size={11} />
        </button>
      )}
    </div>
  );
};

// ─── Shared toolbar sub-components ────────────────────────────────────────────
function Toolbar({ children, onPointerDown }: { children: React.ReactNode; onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <div
      data-fmt-toolbar="true"
      className="no-print"
      onPointerDown={onPointerDown}
      style={{
        position: 'absolute', top: -38, left: 0,
        background: '#1f2937', borderRadius: 7, padding: '3px 5px',
        display: 'flex', gap: 1, zIndex: 9999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
        whiteSpace: 'nowrap', alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
}

function TBtn({ onPointerDown, title, children }: { onPointerDown: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onPointerDown={e => { e.preventDefault(); onPointerDown(); }}
      title={title}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: '3px 5px', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 22, minHeight: 22 }}
      className="hover:bg-white/15 hover:text-white transition-colors"
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 14, background: '#374151', margin: '0 2px', flexShrink: 0 }} />;
}

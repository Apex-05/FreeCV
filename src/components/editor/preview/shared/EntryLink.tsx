import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface EntryLinkProps {
  link: string;
  onUpdate: (v: string) => void;
  isPrinting: boolean;
  accentColor: string;
  size?: number;
}

export const EntryLink: React.FC<EntryLinkProps> = ({ link, onUpdate, isPrinting, accentColor, size = 11 }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(link);

  const openLink = () => {
    if (!link) return;
    const url = /^https?:\/\//i.test(link) ? link : `https://${link}`;
    // block non-http(s) schemes (javascript:, data:, etc.)
    if (!/^https?:\/\//i.test(url)) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isPrinting) {
    if (!link) return null;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: accentColor, marginLeft: 4 }}>
        <ExternalLink size={size} />
        <span style={{ fontSize: size, textDecoration: 'underline' }}>{link}</span>
      </span>
    );
  }

  if (editing) {
    return (
      <span className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 4 }} onClick={e => e.stopPropagation()}>
        <ExternalLink size={size} style={{ color: accentColor, flexShrink: 0 }} />
        <input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={() => { onUpdate(val); setEditing(false); }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { onUpdate(val); setEditing(false); } }}
          placeholder="https://..."
          style={{ fontSize: size, border: `1px solid ${accentColor}`, borderRadius: 3, padding: '1px 4px', outline: 'none', width: 160, color: '#374151' }}
        />
      </span>
    );
  }

  if (link) {
    return (
      <span
        className="no-print group"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: accentColor, marginLeft: 4, cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); openLink(); }}
        onContextMenu={e => { e.preventDefault(); setEditing(true); }}
        title={`${link}\nRight-click to edit`}
      >
        <ExternalLink size={size} />
        <span style={{ fontSize: size, textDecoration: 'underline', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</span>
      </span>
    );
  }

  // No link — show add button on hover
  return (
    <button
      className="no-print opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={e => { e.stopPropagation(); setVal(''); setEditing(true); }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', marginLeft: 4, padding: '0 2px' }}
      title="Add link"
    >
      <ExternalLink size={size} />
    </button>
  );
};

import React from 'react';
import type { CustomSection } from '../../../../types/resume';
import { EditableField, EditableBullet } from '../EditableField';
import { useResumeStore } from '../../../../store/resumeStore';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  section: CustomSection;
  accentColor: string;
  fontSize: number;
  lineHeight: number;
  sectionSpacing: number;
  isPrinting: boolean;
  headerElement: React.ReactNode;
}

export const CustomSectionBlock: React.FC<Props> = ({
  section, accentColor, fontSize, isPrinting, headerElement, sectionSpacing,
}) => {
  const store = useResumeStore();

  const AddBtn = ({ onClick, label }: { onClick: () => void; label: string }) =>
    isPrinting ? null : (
      <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 11, padding: '2px 0', display: 'flex', alignItems: 'center', gap: 3 }} className="no-print hover:text-indigo-500">
        <Plus size={11} /> {label}
      </button>
    );

  const DelBtn = ({ onClick }: { onClick: () => void }) =>
    isPrinting ? null : (
      <button onClick={onClick} className="no-print opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 ml-1" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', flexShrink: 0 }}>
        <Trash2 size={11} />
      </button>
    );

  return (
    <div style={{ marginTop: sectionSpacing * 4 + 'px' }}>
      {headerElement}
      {section.entries.map(entry => (
        <div key={entry.id} className="group" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flex: 1 }}>
              <EditableField value={entry.heading} onChange={v => store.updateCustomSectionEntry(section.id, entry.id, 'heading', v)}
                style={{ fontWeight: 700, fontSize: fontSize + 'px' }} />
              {!isPrinting && <DelBtn onClick={() => store.removeCustomSectionEntry(section.id, entry.id)} />}
            </div>
            <EditableField value={entry.date} onChange={v => store.updateCustomSectionEntry(section.id, entry.id, 'date', v)}
                style={{ color: '#6b7280', fontSize: fontSize - 0.5 + 'px', flexShrink: 0 }} />
          </div>
          <EditableField value={entry.subheading} onChange={v => store.updateCustomSectionEntry(section.id, entry.id, 'subheading', v)}
            style={{ color: accentColor, fontStyle: 'italic', fontSize: fontSize - 0.5 + 'px', display: 'block' }} />
          {entry.bullets.map((b, bi) => (
            <EditableBullet key={bi} value={b} accentColor={accentColor}
              onChange={v => store.updateCustomSectionEntryBullet(section.id, entry.id, bi, v)}
              onRemove={() => store.removeCustomSectionEntryBullet(section.id, entry.id, bi)}
              isPrinting={isPrinting} />
          ))}
          <AddBtn onClick={() => store.addCustomSectionEntryBullet(section.id, entry.id)} label="+ Add point" />
        </div>
      ))}
      <AddBtn onClick={() => store.addCustomSectionEntry(section.id)} label={`+ Add entry to ${section.title}`} />
    </div>
  );
};

import React from 'react';
import { useResumeStore } from '../../../../store/resumeStore';
import { CONTACT_ICONS } from '../../sidebar/ContactPanel';
import type { ContactLink } from '../../../../types/resume';
import { EditableField } from '../EditableField';

interface ContactRowProps {
  accent: string;
  fontSize: number;
  isPrinting: boolean;
  style?: React.CSSProperties;
  iconColor?: string;
  separator?: string;
  layout?: 'row' | 'column';
}

export const ContactRow: React.FC<ContactRowProps> = ({
  accent, fontSize, isPrinting, style, iconColor, separator = '|', layout = 'row',
}) => {
  const { resume, updateContactLink } = useResumeStore();
  const visibleLinks = resume.personalInfo.contactLinks.filter(l => l.visible && l.value.trim());

  if (visibleLinks.length === 0) return null;

  const LinkItem = ({ link }: { link: ContactLink }) => {
    const Icon = CONTACT_ICONS[link.type];
    const ic = iconColor ?? accent;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        <Icon size={Math.max(9, fontSize - 2)} style={{ color: ic, flexShrink: 0 }} />
        {isPrinting
          ? <span style={{ color: style?.color ?? '#374151' }}>{link.value}</span>
          : <EditableField
              value={link.value}
              onChange={v => updateContactLink(link.id, { value: v })}
              style={{ color: style?.color ?? '#374151' }}
            />}
      </span>
    );
  };

  if (layout === 'column') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, ...style }}>
        {visibleLinks.map(link => <LinkItem key={link.id} link={link} />)}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: `2px ${fontSize + 4}px`, fontSize: fontSize - 1 + 'px', ...style }}>
      {visibleLinks.map((link, i) => (
        <React.Fragment key={link.id}>
          {i > 0 && <span style={{ color: '#d1d5db', flexShrink: 0 }}>{separator}</span>}
          <LinkItem link={link} />
        </React.Fragment>
      ))}
    </div>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useResumeStore } from '../../../store/resumeStore';
import type { ContactLink, ContactLinkType } from '../../../types/resume';
import { Mail, Phone, MapPin, Globe, Link2, GripVertical, Eye, EyeOff, Trash2, Plus, Camera } from 'lucide-react';
import { Github, Linkedin, Twitter, Instagram, Youtube, Orcid } from '../../icons/social';

export const CONTACT_ICONS: Record<ContactLinkType, React.ElementType> = {
  email: Mail, phone: Phone, location: MapPin,
  linkedin: Linkedin, github: Github, twitter: Twitter,
  instagram: Instagram, website: Globe, portfolio: Globe,
  orcid: Orcid, youtube: Youtube, custom: Link2,
};

export const CONTACT_LABELS: Record<ContactLinkType, string> = {
  email: 'Email', phone: 'Phone', location: 'Location',
  linkedin: 'LinkedIn', github: 'GitHub', twitter: 'Twitter / X',
  instagram: 'Instagram', website: 'Website', portfolio: 'Portfolio',
  orcid: 'ORCID', youtube: 'YouTube', custom: 'Custom Link',
};

export const CONTACT_COLORS: Record<ContactLinkType, string> = {
  email: '#ef4444', phone: '#3b82f6', location: '#10b981',
  linkedin: '#0a66c2', github: '#333', twitter: '#1d9bf0',
  instagram: '#e1306c', website: '#6366f1', portfolio: '#8b5cf6',
  orcid: '#a6ce39', youtube: '#ff0000', custom: '#6b7280',
};

const ADDABLE: ContactLinkType[] = [
  'email', 'phone', 'location', 'linkedin', 'github', 'twitter',
  'instagram', 'website', 'portfolio', 'youtube', 'orcid', 'custom',
];

function SortableLink({ link, onUpdate, onRemove }: {
  link: ContactLink;
  onUpdate: (patch: Partial<ContactLink>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const Icon = CONTACT_ICONS[link.type];
  const color = CONTACT_COLORS[link.type];
  const [editing, setEditing] = useState(false);

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="group">
      <div className={`flex items-start gap-2 p-2.5 rounded-xl border transition-all ${isDragging ? 'shadow-lg border-indigo-200 bg-indigo-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
        <button {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 mt-0.5 flex-shrink-0">
          <GripVertical size={13} />
        </button>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
          <Icon size={12} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-1">{CONTACT_LABELS[link.type]}</div>
          {editing ? (
            <input autoFocus value={link.value}
              onChange={e => onUpdate({ value: e.target.value })}
              onBlur={() => setEditing(false)}
              onKeyDown={e => e.key === 'Enter' && setEditing(false)}
              className="w-full text-xs border border-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          ) : (
            <div onClick={() => setEditing(true)}
              className="text-xs text-gray-700 truncate cursor-text hover:text-indigo-600 transition-colors"
              title={link.value}>
              {link.value || <span className="text-gray-300 italic">Click to set value</span>}
            </div>
          )}
          {link.type === 'custom' && (
            <input value={link.label || ''} onChange={e => onUpdate({ label: e.target.value })}
              placeholder="Display label"
              className="w-full text-[10px] text-gray-500 border-none outline-none mt-0.5 bg-transparent" />
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onUpdate({ visible: !link.visible })}
            className={`p-1 rounded transition-colors ${link.visible ? 'text-indigo-500 hover:bg-indigo-50' : 'text-gray-300 hover:bg-gray-100'}`}>
            {link.visible ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
          <button onClick={onRemove} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export const ContactPanel: React.FC = () => {
  const { resume, updatePersonalInfo, addContactLink, updateContactLink, removeContactLink, reorderContactLinks } = useResumeStore();
  const { personalInfo } = resume;
  const [showAdd, setShowAdd] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const links = personalInfo.contactLinks;
      const oldIdx = links.findIndex(l => l.id === active.id);
      const newIdx = links.findIndex(l => l.id === over.id);
      reorderContactLinks(arrayMove(links, oldIdx, newIdx));
    }
  };

  const photoRef = React.useRef<HTMLInputElement>(null);
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => updatePersonalInfo('photo', ev.target?.result as string);
    r.readAsDataURL(f);
  };

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="p-4 space-y-5">
      {/* Photo */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
          <Camera size={12} /> Profile Photo
        </h3>
        <div className="flex items-center gap-3">
          <div onClick={() => photoRef.current?.click()} className="w-16 h-16 rounded-full border-2 border-dashed border-gray-200 hover:border-indigo-400 cursor-pointer overflow-hidden flex items-center justify-center bg-gray-50 transition-colors flex-shrink-0 relative group">
            {personalInfo.photo
              ? <img src={personalInfo.photo} alt="" className="w-full h-full object-cover" />
              : <Camera size={18} className="text-gray-300" />}
          </div>
          <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          <div className="flex-1 space-y-1.5">
            <button onClick={() => photoRef.current?.click()} className="block text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
              {personalInfo.photo ? 'Change photo' : 'Upload photo'}
            </button>
            {personalInfo.photo && (
              <>
                <button
                  onClick={() => window.dispatchEvent(new Event('freecv:open-photo-editor'))}
                  className="block text-xs text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ✏️ Edit (crop, zoom, rotate)
                </button>
                <button onClick={() => updatePersonalInfo('photo', null)} className="block text-xs text-red-400 hover:text-red-600 transition-colors">
                  Remove photo
                </button>
              </>
            )}
            {!personalInfo.photo && <p className="text-[10px] text-gray-400">Supported on all templates</p>}
          </div>
        </div>
        {/* Show photo toggle */}
        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100">
          <span className="text-xs text-gray-600">Show photo in resume</span>
          <button
            onClick={() => updatePersonalInfo('showPhoto' as keyof typeof personalInfo, !personalInfo.showPhoto as unknown as string)}
            className={`relative w-9 h-5 rounded-full transition-colors ${personalInfo.showPhoto !== false ? 'bg-indigo-500' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${personalInfo.showPhoto !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Contact Links */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Contact & Social Links</h3>
          <span className="text-[10px] text-gray-400">{personalInfo.contactLinks.filter(l => l.visible).length} visible</span>
        </div>
        <p className="text-[10px] text-gray-400 mb-3">Drag to reorder · Toggle visibility · Click value to edit</p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={personalInfo.contactLinks.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {personalInfo.contactLinks.map(link => (
                <SortableLink key={link.id} link={link}
                  onUpdate={patch => updateContactLink(link.id, patch)}
                  onRemove={() => removeContactLink(link.id)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {personalInfo.contactLinks.length === 0 && (
          <div className="text-center py-6 text-xs text-gray-400">
            No contact links yet. Add one below.
          </div>
        )}

        {/* Add Link */}
        <div className="mt-3">
          {showAdd ? (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Choose type</p>
              <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
                {ADDABLE.map(type => {
                  const Icon = CONTACT_ICONS[type];
                  const color = CONTACT_COLORS[type];
                  return (
                    <button key={type} onClick={() => { addContactLink(type); setShowAdd(false); }}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '15' }}>
                        <Icon size={13} style={{ color }} />
                      </div>
                      <span className="text-[9px] text-gray-600 font-medium text-center leading-tight">{CONTACT_LABELS[type]}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setShowAdd(false)} className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
            </motion.div>
          ) : (
            <button onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-all">
              <Plus size={13} /> Add contact link
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

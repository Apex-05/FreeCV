import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useResumeStore } from '../../../store/resumeStore';
import type { SectionConfig } from '../../../types/resume';
import { GripVertical, Eye, EyeOff, BookOpen, Briefcase, Code, Wrench, Award, FileText, Plus, Trash2, Check, X, RotateCcw, RotateCw } from 'lucide-react';

const SECTION_ICONS: Record<string, React.ElementType> = {
  summary: FileText,
  education: BookOpen,
  experience: Briefcase,
  projects: Code,
  skills: Wrench,
  certifications: Award,
  custom: FileText,
};

const STANDARD_IDS = ['summary', 'education', 'experience', 'projects', 'skills', 'certifications'];

const QUICK_SECTIONS = [
  'Co-curricular Activities', 'Volunteer Work', 'Publications', 'Awards & Honors',
  'Languages', 'Interests & Hobbies', 'References', 'Conferences',
];

function SortableSection({ section, onToggle, onDelete }: {
  section: SectionConfig;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const Icon = SECTION_ICONS[section.type] ?? FileText;
  const isCustom = section.type === 'custom';

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={`group flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${isDragging ? 'shadow-lg bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
    >
      <button {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-0.5 rounded transition-colors flex-shrink-0">
        <GripVertical size={14} />
      </button>
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isCustom ? 'bg-purple-50' : 'bg-indigo-50'}`}>
        <Icon size={13} className={isCustom ? 'text-purple-400' : 'text-indigo-400'} />
      </div>
      <span className={`flex-1 text-sm font-medium truncate ${section.visible ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
        {section.label.replace(/<[^>]*>/g, '')}
      </span>
      <button
        onClick={onToggle}
        className={`p-1 rounded-lg transition-all flex-shrink-0 ${section.visible ? 'text-indigo-500 hover:bg-indigo-50' : 'text-gray-300 hover:bg-gray-100'}`}
        title={section.visible ? 'Hide section' : 'Show section'}
      >
        {section.visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
      <button
        onClick={onDelete}
        className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
        title="Remove section"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export const SectionsPanel: React.FC = () => {
  const { resume, updateSection, reorderSections, deleteSection, restoreSection, addCustomSection } = useResumeStore();
  const committed = resume.sections;

  const [pending, setPending] = useState<SectionConfig[]>(committed);
  const [hasPending, setHasPending] = useState(false);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  // Sync pending from store when no unsaved drag order
  useEffect(() => {
    if (!hasPending) setPending(committed);
  }, [committed, hasPending]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = pending.findIndex(s => s.id === active.id);
      const newIndex = pending.findIndex(s => s.id === over.id);
      setPending(arrayMove(pending, oldIndex, newIndex));
      setHasPending(true);
    }
  };

  const applyOrder = () => {
    reorderSections(pending);
    setHasPending(false);
  };

  const resetOrder = () => {
    setPending(committed);
    setHasPending(false);
  };

  const handleToggle = (id: string) => {
    const current = committed.find(s => s.id === id);
    updateSection(id, { visible: !current?.visible });
    setPending(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  };

  const handleDelete = (id: string) => {
    deleteSection(id);
    // Always keep pending in sync so DnD state doesn't go stale
    setPending(prev => prev.filter(s => s.id !== id));
    // If pending was dirty but now everything is applied, check if we should clear hasPending
    // (hasPending is about order, not presence — keep it as-is)
  };

  const confirmAdd = () => {
    const t = title.trim();
    if (t) addCustomSection(t);
    setTitle('');
    setAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') confirmAdd();
    if (e.key === 'Escape') { setAdding(false); setTitle(''); }
  };

  // Find deleted standard sections (not in pending/committed)
  const deletedStandard = STANDARD_IDS.filter(id => !pending.some(s => s.id === id));

  const STANDARD_LABELS: Record<string, string> = {
    summary: 'Summary', education: 'Education', experience: 'Experience',
    projects: 'Projects', skills: 'Skills', certifications: 'Certifications',
  };

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="p-4">
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Manage Sections</h3>
        <p className="text-xs text-gray-500">Drag to reorder · Toggle visibility · Hover to delete</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={pending.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {pending.map(section => (
              <SortableSection
                key={section.id}
                section={section}
                onToggle={() => handleToggle(section.id)}
                onDelete={() => handleDelete(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Apply / Cancel order buttons */}
      <AnimatePresence>
        {hasPending && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-3"
          >
            <div className="flex gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <button
                onClick={applyOrder}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Check size={12} /> Apply Order
              </button>
              <button
                onClick={resetOrder}
                className="px-3 py-2 bg-white text-gray-500 text-xs rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                title="Reset to saved order"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restore deleted standard sections */}
      <AnimatePresence>
        {deletedStandard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-3"
          >
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1.5 mb-2">
                <RotateCw size={11} className="text-gray-400" />
                <p className="text-xs font-semibold text-gray-500">Restore removed sections</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {deletedStandard.map(id => (
                  <button
                    key={id}
                    onClick={() => restoreSection(id)}
                    className="text-xs px-2.5 py-1 bg-white text-gray-600 border border-gray-200 rounded-lg hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-1"
                  >
                    <Plus size={10} /> {STANDARD_LABELS[id]}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add custom section */}
      <div className="mt-4">
        <AnimatePresence>
          {adding ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-2">
                <input
                  autoFocus
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Section title…"
                  className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {QUICK_SECTIONS.map(qs => (
                  <button
                    key={qs}
                    onClick={() => { addCustomSection(qs); setAdding(false); setTitle(''); }}
                    className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    {qs}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={confirmAdd}
                  disabled={!title.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                >
                  <Check size={13} /> Add Section
                </button>
                <button
                  onClick={() => { setAdding(false); setTitle(''); }}
                  className="px-3 py-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
            >
              <Plus size={14} /> Add Custom Section
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

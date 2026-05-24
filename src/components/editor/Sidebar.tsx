import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BookOpen, Settings, Layers, Link, History, LayoutTemplate } from 'lucide-react';
import { GuidePanel } from './sidebar/GuidePanel';
import { SettingsPanel } from './sidebar/SettingsPanel';
import { SectionsPanel } from './sidebar/SectionsPanel';
import { ContactPanel } from './sidebar/ContactPanel';
import { RecoveryPanel } from './sidebar/RecoveryPanel';
import { TemplatePanel } from './sidebar/TemplatePanel';

const TABS = [
  { id: 'guide',    label: 'Guide',    icon: BookOpen       },
  { id: 'contact',  label: 'Contact',  icon: Link           },
  { id: 'settings', label: 'Style',    icon: Settings       },
  { id: 'sections', label: 'Sections', icon: Layers         },
  { id: 'template', label: 'Template', icon: LayoutTemplate },
  { id: 'history',  label: 'History',  icon: History        },
];

const MIN_WIDTH = 220;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 480;

export const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState('guide');
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH as number);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth.current + delta)));
    };
    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Allow external events to switch to the History tab (e.g., from recovery banner)
  useEffect(() => {
    const handler = () => setActiveTab('history');
    window.addEventListener('freecv:open-history', handler);
    return () => window.removeEventListener('freecv:open-history', handler);
  }, []);

  const handleDragStart = (e: React.MouseEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  return (
    <div style={{ width, flexShrink: 0, display: 'flex', position: 'relative' }} className="h-full">
      <aside className="flex flex-col bg-white border-r border-gray-100 overflow-hidden" style={{ flex: 1 }}>
        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`sidebar-tab flex-1 justify-center min-w-0 ${activeTab === tab.id ? 'active' : ''}`}
              style={{ flexDirection: 'column', gap: 2, padding: '8px 4px', fontSize: 10 }}>
              <tab.icon size={14} />
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.03em' }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'guide'    && <GuidePanel    key="guide"    />}
            {activeTab === 'contact'  && <ContactPanel  key="contact"  />}
            {activeTab === 'settings' && <SettingsPanel key="settings" />}
            {activeTab === 'sections' && <SectionsPanel key="sections" />}
            {activeTab === 'template' && <TemplatePanel key="template" />}
            {activeTab === 'history'  && <RecoveryPanel key="history"  />}
          </AnimatePresence>
        </div>
      </aside>

      {/* Resize Handle */}
      <div
        onMouseDown={handleDragStart}
        className="w-1.5 flex-shrink-0 cursor-col-resize group relative flex items-center justify-center"
        style={{ background: 'transparent' }}
        title="Drag to resize sidebar"
      >
        <div className="absolute inset-0 group-hover:bg-indigo-300 transition-colors opacity-0 group-hover:opacity-100" />
        <div className="w-0.5 h-10 bg-gray-200 rounded-full group-hover:bg-indigo-400 transition-colors" />
      </div>
    </div>
  );
};

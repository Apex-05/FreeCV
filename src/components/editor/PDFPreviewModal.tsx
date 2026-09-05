import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { ResumePreview } from './preview/ResumePreview';

export const PDFPreviewModal: React.FC = () => {
  const isPreviewMode = useResumeStore(s => s.isPreviewMode);
  const setPreviewMode = useResumeStore(s => s.setPreviewMode);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isPreviewMode) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewMode(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPreviewMode, setPreviewMode]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isPreviewMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isPreviewMode]);

  if (!isPreviewMode) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(10,10,20,0.88)', backdropFilter: 'blur(6px)' }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-white/20" />
          <div className="w-3 h-3 rounded-full bg-white/20" />
          <div className="w-3 h-3 rounded-full bg-white/20" />
          <span className="text-white/50 text-xs font-medium ml-2">PDF Preview</span>
        </div>
        <button
          onClick={() => setPreviewMode(false)}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
        >
          <X size={14} /> Close
        </button>
      </div>

      {/* Scrollable paper area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto flex justify-center py-8 px-4"
        onClick={e => { if (e.target === e.currentTarget) setPreviewMode(false); }}
      >
        {/* Paper */}
        <div
          style={{
            width: 816,
            minHeight: 1056,
            background: '#fff',
            boxShadow: '0 8px 60px rgba(0,0,0,0.6), 0 2px 12px rgba(0,0,0,0.4)',
            borderRadius: 2,
            flexShrink: 0,
          }}
        >
          <ResumePreview />
        </div>
      </div>
    </div>
  );
};

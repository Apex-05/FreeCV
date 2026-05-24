import React, { useRef, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useResumeStore } from '../../../store/resumeStore';
import { AwesomeCVTemplate } from './templates/AwesomeCVTemplate';
import { JakeTemplate } from './templates/JakeTemplate';
import { DeedyTemplate } from './templates/DeedyTemplate';
import { TwentySecondsTemplate } from './templates/TwentySecondsTemplate';
import { SB2NovTemplate } from './templates/SB2NovTemplate';
import { FriggeriTemplate } from './templates/FriggeriTemplate';
import { AcademicCVTemplate } from './templates/AcademicCVTemplate';
import { HipsterTemplate } from './templates/HipsterTemplate';
import { ModernCVTemplate } from './templates/ModernCVTemplate';
import { AltaCVTemplate } from './templates/AltaCVTemplate';

const PAGE_HEIGHT_PX = 1056; // US Letter at 96dpi

export const ResumePreview: React.FC = () => {
  const { resume, isPrinting, isPreviewMode } = useResumeStore();
  const { template, sideMargin } = resume.settings;
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  const templateProps = { data: resume, isPrinting: isPrinting || isPreviewMode };

  const Template = () => {
    switch (template) {
      case 'awesomecv':    return <AwesomeCVTemplate    {...templateProps} />;
      case 'jake':         return <JakeTemplate         {...templateProps} />;
      case 'deedy':        return <DeedyTemplate        {...templateProps} />;
      case 'twentyseconds':return <TwentySecondsTemplate {...templateProps} />;
      case 'sb2nov':       return <SB2NovTemplate       {...templateProps} />;
      case 'friggeri':     return <FriggeriTemplate     {...templateProps} />;
      case 'academiccv':   return <AcademicCVTemplate   {...templateProps} />;
      case 'hipster':      return <HipsterTemplate      {...templateProps} />;
      case 'moderncv':     return <ModernCVTemplate     {...templateProps} />;
      case 'altacv':       return <AltaCVTemplate       {...templateProps} />;
      default:             return <AwesomeCVTemplate    {...templateProps} />;
    }
  };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const h = el.scrollHeight;
      setPageCount(Math.max(1, Math.ceil(h / PAGE_HEIGHT_PX)));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const sm = sideMargin ?? 0;

  return (
    <div className="relative" style={{ width: 816 }}>
      {/* Page break indicators */}
      {!isPrinting && Array.from({ length: pageCount - 1 }).map((_, i) => (
        <div
          key={i}
          className="no-print absolute left-0 right-0 z-10 pointer-events-none"
          style={{ top: PAGE_HEIGHT_PX * (i + 1) - 1 }}
        >
          <div className="relative">
            <div className="border-t-2 border-dashed border-indigo-300/60" />
            <span className="absolute right-2 -top-3 text-[9px] text-indigo-400/70 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
              Page {i + 2}
            </span>
          </div>
        </div>
      ))}

      <div
        ref={canvasRef}
        id="resume-canvas"
        className={`resume-page ${isPreviewMode ? 'pointer-events-none select-none' : ''}`}
        style={{ position: 'relative', paddingLeft: sm, paddingRight: sm }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={template}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
          >
            <Template />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Preview mode overlay badge */}
      {isPreviewMode && !isPrinting && (
        <div className="no-print absolute top-3 left-3 bg-indigo-600/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full pointer-events-none">
          Preview Mode — click Edit to make changes
        </div>
      )}
    </div>
  );
};

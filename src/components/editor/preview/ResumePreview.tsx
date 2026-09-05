import React, { useRef } from 'react';
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
import type { ResumeData } from '../../../types/resume';

// Stable map outside component, so we avoid a new component type on every render
const TEMPLATE_MAP: Record<string, React.ComponentType<{ data: ResumeData; isPrinting: boolean }>> = {
  awesomecv:     AwesomeCVTemplate,
  jake:          JakeTemplate,
  deedy:         DeedyTemplate,
  twentyseconds: TwentySecondsTemplate,
  sb2nov:        SB2NovTemplate,
  friggeri:      FriggeriTemplate,
  academiccv:    AcademicCVTemplate,
  hipster:       HipsterTemplate,
  moderncv:      ModernCVTemplate,
  altacv:        AltaCVTemplate,
};

export const ResumePreview: React.FC = () => {
  const resume      = useResumeStore(s => s.resume);
  const isPrinting  = useResumeStore(s => s.isPrinting);
  const isPreviewMode = useResumeStore(s => s.isPreviewMode);

  const { template, sideMargin } = resume.settings;
  const canvasRef = useRef<HTMLDivElement>(null);

  const TemplateComponent = TEMPLATE_MAP[template] ?? AwesomeCVTemplate;
  const sm = sideMargin ?? 0;

  return (
    <div className="relative" style={{ width: 816 }}>
      {/* Page break indicators */}

      <div
        ref={canvasRef}
        id="resume-canvas"
        className={`resume-page ${isPreviewMode ? 'pointer-events-none select-none' : ''}`}
        style={{ position: 'relative', paddingLeft: sm, paddingRight: sm }}
      >
        <div key={template} style={{ animation: 'templateFadeIn 0.18s ease-out' }}>
          <TemplateComponent
            data={resume}
            isPrinting={isPrinting || isPreviewMode}
          />
        </div>
      </div>

    </div>
  );
};

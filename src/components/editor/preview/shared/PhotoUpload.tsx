import React, { useRef, useState } from 'react';
import { useResumeStore } from '../../../../store/resumeStore';
import { Camera, X, Move } from 'lucide-react';

interface PhotoUploadProps {
  size?: number;
  borderColor?: string;
  isPrinting: boolean;
}

const POSITIONS = [
  ['left top', 'center top', 'right top'],
  ['left center', 'center center', 'right center'],
  ['left bottom', 'center bottom', 'right bottom'],
];

const POS_LABELS: Record<string, string> = {
  'left top': '↖', 'center top': '↑', 'right top': '↗',
  'left center': '←', 'center center': '·', 'right center': '→',
  'left bottom': '↙', 'center bottom': '↓', 'right bottom': '↘',
};

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  size = 72, borderColor = '#e5e7eb', isPrinting,
}) => {
  const { resume, updatePersonalInfo, updateSettings } = useResumeStore();
  const { photo } = resume.personalInfo;
  const { photoShape, photoPosition } = resume.settings;
  const ref = useRef<HTMLInputElement>(null);
  const [repositioning, setRepositioning] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => updatePersonalInfo('photo', ev.target?.result as string);
    r.readAsDataURL(f);
  };

  const radius = photoShape === 'circle' ? '50%' : photoShape === 'rounded' ? `${Math.round(size * 0.18)}px` : '6px';

  const showPhoto = resume.personalInfo.showPhoto !== false;
  if (!showPhoto) return null;
  if (isPrinting && !photo) return null;
  if (isPrinting) {
    return (
      <img src={photo!} alt="Profile"
        style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', objectPosition: photoPosition, flexShrink: 0 }} />
    );
  }

  return (
    <div className="no-print relative flex-shrink-0 group" style={{ width: size, height: size }}>
      <input ref={ref} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      <div
        onClick={() => !repositioning && ref.current?.click()}
        className={`overflow-hidden flex items-center justify-center transition-all ${repositioning ? 'cursor-default' : 'cursor-pointer hover:opacity-90'}`}
        style={{ width: size, height: size, borderRadius: radius, border: `2px dashed ${photo ? 'transparent' : borderColor}`, background: photo ? 'transparent' : '#f9fafb' }}
      >
        {photo
          ? <img src={photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: photoPosition, borderRadius: radius }} />
          : <div className="text-center text-gray-300">
              <Camera size={size > 60 ? 20 : 14} />
              <div style={{ fontSize: 9, marginTop: 2, lineHeight: 1.2, color: '#9ca3af' }}>Add Photo</div>
            </div>
        }
      </div>

      {/* Reposition overlay */}
      {repositioning && photo && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ borderRadius: radius, background: 'rgba(0,0,0,0.55)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {POSITIONS.map((row, ri) =>
              row.map((pos, ci) => (
                <button
                  key={pos}
                  onClick={() => { updateSettings({ photoPosition: pos }); setRepositioning(false); }}
                  title={pos}
                  className="flex items-center justify-center text-white font-bold transition-colors rounded"
                  style={{
                    width: Math.round(size / 3) - 2, height: Math.round(size / 3) - 2, fontSize: 11,
                    background: photoPosition === pos ? 'rgba(99,102,241,0.9)' : 'rgba(255,255,255,0.15)',
                  }}
                >
                  {POS_LABELS[pos]}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      {photo && !repositioning && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1 gap-1">
          <button
            onClick={e => { e.stopPropagation(); setRepositioning(true); }}
            className="no-print w-5 h-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-sm transition-colors"
            title="Reposition photo"
          >
            <Move size={9} strokeWidth={2.5} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); updatePersonalInfo('photo', null); }}
            className="no-print w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm transition-colors"
            title="Remove photo"
          >
            <X size={9} strokeWidth={3} />
          </button>
        </div>
      )}

      {repositioning && (
        <button
          onClick={() => setRepositioning(false)}
          className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center shadow z-20"
          style={{ fontSize: 10 }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

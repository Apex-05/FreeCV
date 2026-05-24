import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useResumeStore } from '../../../store/resumeStore';
import { templateConfigs } from '../../../data/templateConfigs';
import type { TemplateId } from '../../../types/resume';
import { Check, Type, AlignJustify, Rows, Layout, Palette, Layers, Image, Circle, Square, List } from 'lucide-react';

const ACCENT_COLORS = [
  { hex: '#6366f1', name: 'Indigo' }, { hex: '#8b5cf6', name: 'Violet' },
  { hex: '#3b82f6', name: 'Blue' }, { hex: '#14b8a6', name: 'Teal' },
  { hex: '#22c55e', name: 'Green' }, { hex: '#f97316', name: 'Orange' },
  { hex: '#f43f5e', name: 'Rose' }, { hex: '#dc2626', name: 'Red' },
  { hex: '#ca8a04', name: 'Amber' }, { hex: '#059669', name: 'Emerald' },
  { hex: '#0891b2', name: 'Cyan' }, { hex: '#1e293b', name: 'Slate' },
];

type FontGroup = { group: string; fonts: { value: string; label: string }[] };

const FONT_GROUPS: FontGroup[] = [
  {
    group: 'Sans-serif',
    fonts: [
      { value: 'Inter', label: 'Inter' },
      { value: 'Roboto', label: 'Roboto' },
      { value: 'Lato', label: 'Lato' },
      { value: 'Open Sans', label: 'Open Sans' },
      { value: 'Source Sans 3', label: 'Source Sans 3' },
      { value: 'Nunito', label: 'Nunito' },
      { value: 'DM Sans', label: 'DM Sans' },
      { value: 'Outfit', label: 'Outfit' },
      { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
      { value: 'Raleway', label: 'Raleway' },
      { value: 'Josefin Sans', label: 'Josefin Sans' },
    ],
  },
  {
    group: 'Serif',
    fonts: [
      { value: 'Georgia', label: 'Georgia' },
      { value: 'Merriweather', label: 'Merriweather' },
      { value: 'Playfair Display', label: 'Playfair Display' },
      { value: 'EB Garamond', label: 'EB Garamond' },
      { value: 'Lora', label: 'Lora' },
      { value: 'Libre Baskerville', label: 'Libre Baskerville' },
      { value: 'Crimson Text', label: 'Crimson Text' },
    ],
  },
];

const BULLET_OPTIONS: { value: string; label: string }[] = [
  { value: '•', label: '• Bullet' },
  { value: '▸', label: '▸ Arrow' },
  { value: '–', label: '– Dash' },
  { value: '▪', label: '▪ Square' },
  { value: '◦', label: '◦ Circle' },
];

function Slider({ label, icon: Icon, value, min, max, step, unit, onChange, pct }: {
  label: string; icon: React.ElementType; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void; pct?: number;
}) {
  const percentage = pct ?? ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={13} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{value}{unit}</span>
      </div>
      <div className="slider-wrap">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ '--pct': percentage + '%' } as React.CSSProperties}
          className="w-full" />
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Icon size={13} className="text-gray-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export const SettingsPanel: React.FC = () => {
  const { resume, updateSettings, setTemplate } = useResumeStore();
  const { settings } = resume;

  // Local color state so the picker updates instantly; store write only on commit
  const [liveColor, setLiveColor] = useState(settings.accentColor);
  useEffect(() => { setLiveColor(settings.accentColor); }, [settings.accentColor]);

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="p-4 space-y-6">

      {/* Template */}
      <Section icon={Layers} title="Template">
        <div className="grid grid-cols-2 gap-2">
          {templateConfigs.map(t => (
            <button key={t.id} onClick={() => setTemplate(t.id as TemplateId)}
              className={`relative p-2.5 rounded-xl border-2 text-left transition-all ${settings.template === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="w-3 h-3 rounded-full" style={{ background: t.accentColor }} />
                {settings.template === t.id && <Check size={11} className="text-indigo-600" />}
              </div>
              <p className="text-xs font-semibold text-gray-800 leading-tight">{t.name}</p>
            </button>
          ))}
        </div>
      </Section>

      <div className="h-px bg-gray-100" />

      {/* Typography */}
      <Section icon={Type} title="Typography">
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1.5">Font Family</label>
          <select
            value={settings.fontFamily}
            onChange={e => updateSettings({ fontFamily: e.target.value })}
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-gray-700"
            style={{ fontFamily: settings.fontFamily }}
          >
            {FONT_GROUPS.map(group => (
              <optgroup key={group.group} label={group.group}>
                {group.fonts.map(f => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="text-[10px] text-gray-400 mt-1" style={{ fontFamily: settings.fontFamily }}>
            Preview: The quick brown fox
          </p>
        </div>

        <Slider label="Font Size" icon={Type} value={settings.fontSize} min={9} max={14} step={0.5} unit="px"
          onChange={v => updateSettings({ fontSize: v })} />
        <Slider label="Line Height" icon={AlignJustify} value={settings.lineHeight} min={1.0} max={2.0} step={0.05} unit=""
          onChange={v => updateSettings({ lineHeight: v })} />
      </Section>

      <div className="h-px bg-gray-100" />

      {/* Spacing */}
      <Section icon={Layout} title="Spacing">
        <Slider label="Top Margin" icon={Rows} value={settings.topMargin} min={0} max={20} step={1} unit="px"
          onChange={v => updateSettings({ topMargin: v })} />
        <Slider label="Section Spacing" icon={Rows} value={settings.sectionSpacing} min={0} max={20} step={1} unit="px"
          onChange={v => updateSettings({ sectionSpacing: v })} />
        <Slider label="Side Padding" icon={Layout} value={settings.sideMargin ?? 0} min={0} max={24} step={2} unit="px"
          onChange={v => updateSettings({ sideMargin: v })} />
      </Section>

      <div className="h-px bg-gray-100" />

      {/* Accent Color */}
      <Section icon={Palette} title="Accent Color">
        <div className="flex flex-wrap gap-2 mb-2">
          {ACCENT_COLORS.map(c => (
            <button key={c.hex} onClick={() => updateSettings({ accentColor: c.hex })}
              title={c.name}
              className="w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center"
              style={{ background: c.hex, borderColor: settings.accentColor === c.hex ? '#fff' : c.hex, boxShadow: settings.accentColor === c.hex ? `0 0 0 2px ${c.hex}` : 'none' }}>
              {settings.accentColor === c.hex && <Check size={12} color="white" strokeWidth={3} />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Custom:</label>
          <input
            type="color"
            value={liveColor}
            onChange={e => setLiveColor(e.target.value)}
            onBlur={e => updateSettings({ accentColor: e.target.value })}
            className="w-8 h-7 rounded cursor-pointer border border-gray-200"
          />
          <span className="text-xs font-mono text-gray-500">{liveColor}</span>
        </div>
      </Section>

      <div className="h-px bg-gray-100" />

      {/* Bullet Style */}
      <Section icon={List} title="Bullet Style">
        <div className="grid grid-cols-3 gap-1.5">
          {BULLET_OPTIONS.map(b => (
            <button
              key={b.value}
              onClick={() => updateSettings({ bulletStyle: b.value as typeof settings.bulletStyle })}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium border-2 transition-all ${settings.bulletStyle === b.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </Section>

      <div className="h-px bg-gray-100" />

      {/* Photo Shape */}
      <Section icon={Image} title="Photo Style">
        <div className="grid grid-cols-3 gap-2">
          {(['circle', 'square', 'rounded'] as const).map(shape => (
            <button
              key={shape}
              onClick={() => updateSettings({ photoShape: shape })}
              className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border-2 transition-all ${settings.photoShape === shape ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div
                style={{
                  width: 28, height: 28, background: settings.accentColor + '30',
                  borderRadius: shape === 'circle' ? '50%' : shape === 'rounded' ? '6px' : '3px',
                  border: `2px solid ${settings.accentColor}50`,
                }}
              />
              <span className="text-[10px] text-gray-600 capitalize font-medium">{shape}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400">Shape applies when a photo is uploaded. Hover photo on canvas to reposition.</p>
      </Section>

    </motion.div>
  );
};

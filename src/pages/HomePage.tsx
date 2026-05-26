import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Download, Zap, Shield, Sparkles, FileText, ArrowRight, ChevronDown, Upload, Star, Check, Users } from 'lucide-react';
import { templateConfigs } from '../data/templateConfigs';
import type { TemplateConfig, TemplateId } from '../types/resume';
import { useResumeStore } from '../store/resumeStore';
import { usePDFEditorStore } from '../store/pdfEditorStore';
import toast from 'react-hot-toast';

// ─── Template mini-previews ────────────────────────────────────────────────────
const TEMPLATE_PREVIEWS: Record<string, React.FC<{ accent: string }>> = {
  awesomecv: ({ accent }) => (
    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 7, lineHeight: 1.35 }}>
      <div style={{ background: '#2d3748', padding: '10px 12px 7px' }}>
        <div style={{ color: '#fff', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>ALEX JOHNSON</div>
        <div style={{ color: accent, fontSize: 8, marginTop: 2 }}>Software Engineer</div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 6, marginTop: 4, display: 'flex', gap: 8 }}>
          <span>alex@email.com</span><span>github.com/alex</span><span>linkedin</span>
        </div>
      </div>
      <div style={{ padding: '7px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <div style={{ width: 3, height: 9, background: accent, flexShrink: 0 }} />
          <span style={{ color: accent, fontSize: 6.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>EXPERIENCE</span>
          <div style={{ flex: 1, height: 0.5, background: '#e2e8f0' }} />
        </div>
        <div style={{ borderLeft: `2px solid ${accent}25`, paddingLeft: 6, marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 700, fontSize: 7.5, color: '#1a202c' }}>Senior Engineer</span>
            <span style={{ color: '#a0aec0', fontSize: 6 }}>Jun 2022 – Present</span>
          </div>
          <div style={{ color: accent, fontSize: 6.5, marginTop: 1 }}>Tech Corp · San Francisco, CA</div>
          <div style={{ color: '#718096', fontSize: 6, marginTop: 2 }}>• Built microservices for 2M+ daily users</div>
          <div style={{ color: '#718096', fontSize: 6 }}>• Mentored 4 junior engineers</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <div style={{ width: 3, height: 9, background: accent, flexShrink: 0 }} />
          <span style={{ color: accent, fontSize: 6.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>EDUCATION</span>
          <div style={{ flex: 1, height: 0.5, background: '#e2e8f0' }} />
        </div>
        <div style={{ borderLeft: `2px solid ${accent}25`, paddingLeft: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 7.5, color: '#1a202c' }}>UC Berkeley</span>
          <div style={{ color: '#4a5568', fontSize: 6.5, fontStyle: 'italic' }}>B.S. Computer Science · 2020</div>
        </div>
      </div>
    </div>
  ),

  jake: ({ accent: _ }) => (
    <div style={{ fontFamily: '"Times New Roman", Georgia, serif', fontSize: 7, lineHeight: 1.35, padding: '10px 14px' }}>
      <div style={{ textAlign: 'center', borderBottom: '1.5px solid #1a202c', paddingBottom: 5, marginBottom: 5 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a202c', letterSpacing: '-0.01em' }}>Alex Johnson</div>
        <div style={{ fontSize: 6.5, color: '#4a5568', marginTop: 2 }}>alex@email.com · (555) 123-4567 · SF, CA · github.com/alex</div>
      </div>
      <div style={{ marginBottom: 5 }}>
        <div style={{ textTransform: 'uppercase', fontVariant: 'small-caps', fontWeight: 700, fontSize: 8.5, borderBottom: '1.5px solid #1a202c', paddingBottom: 1, marginBottom: 3, letterSpacing: '0.04em' }}>Experience</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 7.5 }}>Tech Corp</span>
          <span style={{ fontSize: 6.5, color: '#4a5568' }}>San Francisco, CA</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontStyle: 'italic' }}>
          <span style={{ fontSize: 7 }}>Senior Software Engineer</span>
          <span style={{ fontSize: 6.5, color: '#4a5568' }}>Jun 2022 – Present</span>
        </div>
        <div style={{ color: '#4a5568', fontSize: 6, marginTop: 2 }}>• Led microservices architecture serving 2M+ daily active users</div>
        <div style={{ color: '#4a5568', fontSize: 6 }}>• Reduced CI/CD pipeline runtime by 60% through parallelization</div>
      </div>
      <div>
        <div style={{ textTransform: 'uppercase', fontVariant: 'small-caps', fontWeight: 700, fontSize: 8.5, borderBottom: '1.5px solid #1a202c', paddingBottom: 1, marginBottom: 3 }}>Education</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 7.5 }}>University of California, Berkeley</span>
          <span style={{ fontSize: 6.5, color: '#4a5568' }}>May 2020</span>
        </div>
        <div style={{ fontStyle: 'italic', fontSize: 7, color: '#4a5568' }}>B.S. in Computer Science</div>
      </div>
    </div>
  ),

  deedy: ({ accent }) => (
    <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: 7, lineHeight: 1.35, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1a202c', padding: '8px 12px', textAlign: 'center', borderBottom: `3px solid ${accent}` }}>
        <div style={{ color: '#fff', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ALEX JOHNSON</div>
        <div style={{ color: accent, fontSize: 7, marginTop: 2 }}>alex@email.com · github.com/alex · (555) 123-4567</div>
      </div>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ width: '34%', background: '#f7f8fa', padding: '7px 8px', borderRight: '1px solid #e2e8f0' }}>
          <div style={{ background: accent, color: '#fff', fontSize: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 5px', marginBottom: 4 }}>Education</div>
          <div style={{ fontWeight: 700, fontSize: 7.5, color: '#1a202c' }}>UC Berkeley</div>
          <div style={{ color: '#4a5568', fontSize: 6, fontStyle: 'italic' }}>B.S. Computer Science</div>
          <div style={{ color: '#a0aec0', fontSize: 6 }}>2016 – 2020</div>
          <div style={{ background: accent, color: '#fff', fontSize: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 5px', marginTop: 6, marginBottom: 4 }}>Skills</div>
          <div style={{ color: '#4a5568', fontSize: 6 }}>Python · TypeScript</div>
          <div style={{ color: '#4a5568', fontSize: 6 }}>React · Node.js</div>
          <div style={{ color: '#4a5568', fontSize: 6 }}>AWS · Docker</div>
        </div>
        <div style={{ flex: 1, padding: '7px 8px' }}>
          <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', borderBottom: `2px solid ${accent}`, paddingBottom: 2, marginBottom: 4, letterSpacing: '0.05em' }}>Experience</div>
          <div style={{ fontWeight: 700, fontSize: 7.5, color: '#1a202c' }}>Senior Engineer</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 1 }}>
            <span style={{ color: accent, fontWeight: 600, fontSize: 7 }}>Tech Corp</span>
            <span style={{ color: '#a0aec0', fontSize: 6 }}>Jun 2022 – Present</span>
          </div>
          <div style={{ color: '#4a5568', fontSize: 6, marginTop: 2 }}>• Microservices for 2M+ users, –40% latency</div>
          <div style={{ color: '#4a5568', fontSize: 6 }}>• Mentored 4 junior engineers</div>
        </div>
      </div>
    </div>
  ),

  twentyseconds: ({ accent }) => (
    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 7, lineHeight: 1.35, display: 'flex' }}>
      <div style={{ width: '32%', background: '#2c3e50', padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', marginBottom: 5 }} />
        <div style={{ color: '#fff', fontSize: 8.5, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>Alex Johnson</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 6, marginTop: 2, textAlign: 'center' }}>Software Engineer</div>
        <div style={{ width: '100%', marginTop: 8 }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 5.5, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Skills</div>
          {(['React', 'TypeScript', 'Node.js'] as string[]).map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 6, flex: 1 }}>{s}</span>
              <div style={{ display: 'flex', gap: 1.5 }}>
                {[0,1,2,3,4].map(d => <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: d < 5 - i ? accent : 'rgba(255,255,255,0.2)' }} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: '8px 10px' }}>
        <div style={{ color: accent, fontSize: 6.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: `1.5px solid ${accent}`, paddingBottom: 2, marginBottom: 4 }}>Experience</div>
        <div style={{ fontWeight: 700, fontSize: 7.5, color: '#1a202c' }}>Senior Engineer</div>
        <div style={{ color: accent, fontSize: 6.5, marginTop: 1 }}>Tech Corp</div>
        <div style={{ color: '#a0aec0', fontSize: 6, marginTop: 0.5 }}>Jun 2022 – Present</div>
        <div style={{ color: '#4a5568', fontSize: 6, marginTop: 2 }}>• Microservices for 2M+ users</div>
        <div style={{ color: '#4a5568', fontSize: 6 }}>• Reduced latency by 40%</div>
        <div style={{ color: accent, fontSize: 6.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: `1.5px solid ${accent}`, paddingBottom: 2, marginTop: 6, marginBottom: 4 }}>Education</div>
        <div style={{ fontWeight: 700, fontSize: 7.5, color: '#1a202c' }}>UC Berkeley</div>
        <div style={{ fontStyle: 'italic', color: '#4a5568', fontSize: 6.5 }}>B.S. Computer Science · 2020</div>
      </div>
    </div>
  ),

  sb2nov: ({ accent }) => (
    <div style={{ fontFamily: 'Georgia, serif', fontSize: 7, lineHeight: 1.35, padding: '10px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 5, borderBottom: `3px double ${accent}`, marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a202c' }}>Alex Johnson</div>
          <div style={{ color: '#4a5568', fontSize: 6.5, fontStyle: 'italic', marginTop: 1 }}>Senior Software Engineer</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 6, color: '#4a5568', lineHeight: 1.6 }}>
          <div>alex@email.com</div>
          <div>(555) 123-4567</div>
          <div>San Francisco, CA</div>
        </div>
      </div>
      <div style={{ marginBottom: 5 }}>
        <div style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, marginBottom: 3 }}>Professional Summary</div>
        <div style={{ color: '#4a5568', fontSize: 6, fontStyle: 'italic', lineHeight: 1.5 }}>Results-driven engineer with 4+ years building scalable web applications.</div>
      </div>
      <div>
        <div style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, borderBottom: `1px solid ${accent}40`, paddingBottom: 2, marginBottom: 3 }}>Experience</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 7.5 }}>Tech Corp</span>
          <span style={{ color: '#718096', fontSize: 6 }}>Jun 2022 – Present</span>
        </div>
        <div style={{ color: accent, fontSize: 6.5, fontStyle: 'italic' }}>Senior Software Engineer</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', marginTop: 2 }}>
          <div style={{ color: '#4a5568', fontSize: 6 }}>▸ Microservices 2M+ users</div>
          <div style={{ color: '#4a5568', fontSize: 6 }}>▸ Reduced latency 40%</div>
        </div>
      </div>
    </div>
  ),

  friggeri: ({ accent }) => (
    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 7, lineHeight: 1.35 }}>
      <div style={{ background: '#2d2d2d', padding: '10px 14px' }}>
        <div style={{ fontSize: 14, color: '#fff' }}>
          <span style={{ fontWeight: 300 }}>Alex </span>
          <span style={{ fontWeight: 700, color: accent }}>Johnson</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7, marginTop: 2 }}>Software Engineer · alex@email.com</div>
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '30%', background: '#f5f5f5', padding: '8px 8px', borderRight: '1px solid #e2e8f0' }}>
          <div style={{ color: '#9ca3af', fontSize: 5.5, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Contact</div>
          <div style={{ color: '#4a5568', fontSize: 6 }}>alex@email.com</div>
          <div style={{ color: '#4a5568', fontSize: 6 }}>(555) 123-4567</div>
          <div style={{ color: '#9ca3af', fontSize: 5.5, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 5, marginBottom: 3 }}>Skills</div>
          <div style={{ color: '#4a5568', fontSize: 6 }}>React · TypeScript</div>
          <div style={{ color: '#4a5568', fontSize: 6 }}>Node.js · Python</div>
          <div style={{ color: '#4a5568', fontSize: 6 }}>AWS · Docker</div>
        </div>
        <div style={{ flex: 1, padding: '8px 10px' }}>
          <div style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1.5px solid ${accent}`, paddingBottom: 2, marginBottom: 4 }}>Experience</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ color: '#a0aec0', fontSize: 6, width: 50, textAlign: 'right', paddingTop: 1, flexShrink: 0, fontStyle: 'italic' }}>2022–Now</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 7.5, color: '#1a202c' }}>Senior Engineer</div>
              <div style={{ color: accent, fontSize: 6.5 }}>Tech Corp</div>
              <div style={{ color: '#718096', fontSize: 6, marginTop: 1 }}>• Microservices for 2M+ users</div>
              <div style={{ color: '#718096', fontSize: 6 }}>• Reduced latency 40%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),

  academiccv: ({ accent }) => (
    <div style={{ fontFamily: 'Merriweather, Palatino, Georgia, serif', fontSize: 7, lineHeight: 1.35, padding: '10px 14px' }}>
      <div style={{ textAlign: 'center', borderBottom: `1.5px solid ${accent}`, paddingBottom: 6, marginBottom: 5 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a202c' }}>Dr. Alex Johnson</div>
        <div style={{ color: accent, fontStyle: 'italic', fontSize: 7.5, marginTop: 2 }}>Assistant Professor, Computer Science</div>
      </div>
      <div style={{ background: '#f1f5f9', padding: '4px 10px', marginBottom: 6, display: 'flex', justifyContent: 'center', gap: 10, fontSize: 6, color: '#4a5568' }}>
        <span>alex@university.edu</span><span>·</span><span>scholar.google.com</span><span>·</span><span>orcid.org/alex</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
        <div style={{ color: '#a0aec0', fontSize: 6.5, width: 56, textAlign: 'right', flexShrink: 0, fontStyle: 'italic' }}>2020</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: accent, borderBottom: `1px solid ${accent}55`, paddingBottom: 2, marginBottom: 3 }}>Education</div>
          <div style={{ fontWeight: 600, fontSize: 7.5 }}>Ph.D. Computer Science</div>
          <div style={{ color: accent, fontStyle: 'italic', fontSize: 6.5 }}>MIT, Cambridge, MA</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ color: '#a0aec0', fontSize: 6.5, width: 56, textAlign: 'right', flexShrink: 0, fontStyle: 'italic' }}>2020–Now</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: accent, borderBottom: `1px solid ${accent}55`, paddingBottom: 2, marginBottom: 3 }}>Research</div>
          <div style={{ fontWeight: 600, fontSize: 7.5 }}>Distributed Systems at Scale</div>
          <div style={{ color: '#4a5568', fontSize: 6, fontStyle: 'italic' }}>IEEE Conference 2024</div>
        </div>
      </div>
    </div>
  ),

  hipster: ({ accent }) => (
    <div style={{ fontFamily: 'Nunito, Inter, sans-serif', fontSize: 7, lineHeight: 1.35, display: 'flex' }}>
      <div style={{ width: '33%', background: accent, padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.5)', marginBottom: 5 }} />
        <div style={{ color: '#fff', fontSize: 9, fontWeight: 700, textAlign: 'center' }}>Alex Johnson</div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 6, marginTop: 2 }}>Software Engineer</div>
        <div style={{ width: '100%', marginTop: 7 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 5.5, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Skills</div>
          {(['React', 'TypeScript', 'Node.js', 'Python'] as string[]).map(s => (
            <span key={s} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '1.5px 6px', fontSize: 5.5, color: '#fff', marginBottom: 2, display: 'inline-block', marginRight: 2 }}>{s}</span>
          ))}
        </div>
        <div style={{ width: '100%', marginTop: 6 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 5.5, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Contact</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 6 }}>alex@email.com</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 6 }}>(555) 123-4567</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: '8px 10px' }}>
        <div style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, borderBottom: `1.5px solid ${accent}`, paddingBottom: 2, marginBottom: 4 }}>About Me</div>
        <div style={{ color: '#4a5568', fontSize: 6, lineHeight: 1.5, marginBottom: 5 }}>Results-driven engineer with 4+ years building scalable web apps.</div>
        <div style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, borderBottom: `1.5px solid ${accent}`, paddingBottom: 2, marginBottom: 4 }}>Experience</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 700, fontSize: 7.5, color: '#1a202c' }}>Senior Engineer</span>
          <span style={{ background: `${accent}15`, color: accent, fontSize: 5.5, padding: '1px 5px', borderRadius: 10 }}>2022 – Now</span>
        </div>
        <div style={{ color: accent, fontSize: 6.5 }}>Tech Corp</div>
        <div style={{ color: '#718096', fontSize: 6, marginTop: 2 }}>• Microservices for 2M+ users</div>
        <div style={{ color: '#718096', fontSize: 6 }}>• Reduced latency by 40%</div>
      </div>
    </div>
  ),

  moderncv: ({ accent }) => (
    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 7, lineHeight: 1.35 }}>
      <div style={{ background: accent, padding: '10px 14px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 300, color: '#fff', letterSpacing: '0.02em' }}>Alex Johnson</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 7, marginTop: 2, fontWeight: 300 }}>Software Engineer</div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', border: '1.5px solid rgba(255,255,255,0.4)' }} />
      </div>
      <div style={{ background: `${accent}dd`, padding: '4px 14px', display: 'flex', gap: 10, fontSize: 6, color: 'rgba(255,255,255,0.85)' }}>
        <span>alex@email.com</span><span>·</span><span>(555) 123-4567</span><span>·</span><span>linkedin.com/in/alex</span>
      </div>
      <div style={{ padding: '8px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: accent }}>Experience</span>
          <div style={{ flex: 1, height: 1.5, background: accent }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 52, textAlign: 'right', color: '#a0aec0', fontSize: 5.5, fontStyle: 'italic', paddingTop: 1 }}>Jun 2022<br />Present<br /><span style={{ color: '#718096' }}>SF, CA</span></div>
          <div>
            <span style={{ fontWeight: 700, color: '#1a202c', fontSize: 7.5 }}>Senior Engineer</span>
            <span style={{ color: '#a0aec0', margin: '0 4px' }}>at</span>
            <span style={{ fontWeight: 600, color: accent, fontSize: 7 }}>Tech Corp</span>
            <div style={{ color: '#4a5568', fontSize: 6, marginTop: 2 }}>• Microservices for 2M+ users, –40% latency</div>
            <div style={{ color: '#4a5568', fontSize: 6 }}>• Mentored 4 junior engineers</div>
          </div>
        </div>
      </div>
    </div>
  ),

  altacv: ({ accent }) => (
    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 7, lineHeight: 1.35 }}>
      <div style={{ background: `linear-gradient(135deg, ${accent}20 0%, ${accent}08 100%)`, borderBottom: `3px solid ${accent}`, padding: '10px 12px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#1a202c', letterSpacing: '-0.01em' }}>Alex Johnson</div>
          <div style={{ color: accent, fontSize: 8, fontWeight: 500, marginTop: 2 }}>Product Manager</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 6, color: '#4a5568', lineHeight: 1.7 }}>
          <div>alex@email.com</div>
          <div>linkedin.com/in/alex</div>
          <div>San Francisco, CA</div>
        </div>
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '62%', padding: '7px 8px 7px 12px', borderRight: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1a202c', borderBottom: `2px solid ${accent}`, paddingBottom: 3, marginBottom: 4 }}>Experience</div>
          <div style={{ fontWeight: 800, fontSize: 7.5, color: '#1a202c' }}>Senior Engineer</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 1 }}>
            <span style={{ fontWeight: 600, color: accent, fontSize: 7 }}>Tech Corp</span>
            <span style={{ color: '#cbd5e0' }}>·</span>
            <span style={{ color: '#718096', fontSize: 6 }}>SF, CA</span>
          </div>
          <div style={{ color: '#a0aec0', fontSize: 6, fontStyle: 'italic', marginTop: 0.5 }}>Jun 2022 – Present</div>
          <div style={{ color: '#4a5568', fontSize: 6, marginTop: 2 }}>• Microservices for 2M+ daily users</div>
          <div style={{ color: '#4a5568', fontSize: 6 }}>• Reduced latency by 40%</div>
        </div>
        <div style={{ flex: 1, padding: '7px 8px' }}>
          <div style={{ fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, borderBottom: `1.5px solid ${accent}`, paddingBottom: 2, marginBottom: 4 }}>Skills</div>
          {([['React / Next.js', 4], ['TypeScript', 5], ['Node.js', 4], ['AWS', 3]] as [string, number][]).map(([s, level]) => (
            <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontWeight: 600, fontSize: 6.5, color: '#1a202c' }}>{s}</span>
              <div style={{ display: 'flex', gap: 2 }}>
                {[0,1,2,3,4].map(d => <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: d < level ? accent : `${accent}30` }} />)}
              </div>
            </div>
          ))}
          <div style={{ fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, borderBottom: `1.5px solid ${accent}`, paddingBottom: 2, marginTop: 6, marginBottom: 4 }}>Education</div>
          <div style={{ fontWeight: 700, fontSize: 7.5, color: '#1a202c' }}>UC Berkeley</div>
          <div style={{ fontStyle: 'italic', color: '#4a5568', fontSize: 6.5 }}>B.S. Computer Science · 2020</div>
        </div>
      </div>
    </div>
  ),
};

// ─── Animated resume demo (hero right column) ─────────────────────────────────

// Stable constants defined at module scope so they never cause FM to diff/restart
const FLOAT_ANIMATE    = { y: -14 } as const;
const FLOAT_TRANSITION = { repeat: Infinity, repeatType: 'mirror' as const, duration: 2.8, ease: [0.37, 0, 0.63, 1] as const };

const SKILLS: [string, number, string][] = [
  ['React 19',      95, '#6366f1,#818cf8'],
  ['TypeScript',    90, '#8b5cf6,#a78bfa'],
  ['Tailwind CSS',  88, '#06b6d4,#6366f1'],
  ['Framer Motion', 80, '#f59e0b,#f97316'],
];

// Per-skill transitions are also stable — no new object on every render
const SKILL_TRANSITIONS = SKILLS.map((_, i) => ({
  delay: 0.3 + i * 0.18,
  duration: 1.1,
  ease: [0.22, 1, 0.36, 1] as const,
  // NO repeat — bars animate once and stay filled; repeating was the "buffering"
}));

const RSecHead: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
    <div style={{ width: 3, height: 9, background: 'linear-gradient(180deg,#6366f1,#8b5cf6)', borderRadius: 2 }} />
    <span style={{ fontSize: 6.5, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.12em' }}>{label}</span>
    <div style={{ flex: 1, height: 0.5, background: '#e8eaf0' }} />
  </div>
);

// React.memo prevents re-renders when parent HomePage state changes (filter, hover, etc.)
const ResumeAnimation: React.FC = React.memo(() => (
  <div className="select-none" style={{ width: 460, height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
    {/* Ambient glow */}
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.24) 0%, transparent 68%)', filter: 'blur(20px)', pointerEvents: 'none' }} />

    {/* Card + shadow wrapper */}
    <div style={{ position: 'relative', width: 340, zIndex: 1 }}>
      {/* Shadow blobs under card — layered for depth */}
      <div style={{ position: 'absolute', bottom: -36, left: '2%', right: '2%', height: 46, background: 'rgba(99,102,241,0.5)', filter: 'blur(26px)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: -20, left: '18%', right: '18%', height: 22, background: 'rgba(139,92,246,0.35)', filter: 'blur(12px)', borderRadius: '50%' }} />

      {/* Floating card */}
      <motion.div
        animate={FLOAT_ANIMATE}
        transition={FLOAT_TRANSITION}
        style={{ borderRadius: 26, overflow: 'hidden', boxShadow: '0 22px 60px rgba(99,102,241,0.32), 0 8px 32px rgba(0,0,0,0.46)' }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1a1d2e 0%,#232840 100%)', padding: '20px 22px 17px', borderRadius: '26px 26px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 17, fontWeight: 800 }}>A</div>
            <div>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Apex-05</div>
              <div style={{ color: '#818cf8', fontSize: 10.5, marginTop: 3 }}>AI/ML Engineer</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 20px 18px', background: '#fff' }}>
          <RSecHead label="Summary" />
          <div style={{ marginBottom: 13 }}>
            <div style={{ fontSize: 7.5, color: '#475569', lineHeight: 1.55 }}>FreeCV is a resume builder built with React 19, TypeScript, and Framer Motion.</div>
            <div style={{ fontSize: 7.5, color: '#475569', lineHeight: 1.55, marginTop: 3 }}>Edit, preview, and export pixel-perfect PDFs - completely free, no signup required.</div>
          </div>

          <RSecHead label="Skills" />
          <div style={{ marginBottom: 13 }}>
            {SKILLS.map(([skill, pct, grad], i) => (
              <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 8, color: '#475569', width: 68, flexShrink: 0, fontWeight: 500 }}>{skill}</span>
                <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={SKILL_TRANSITIONS[i]}
                    style={{ height: '100%', background: `linear-gradient(90deg,${grad})`, borderRadius: 3 }}
                  />
                </div>
                <span style={{ fontSize: 7.5, color: '#94a3b8', width: 28, textAlign: 'right' as const }}>{pct}%</span>
              </div>
            ))}
          </div>

          <RSecHead label="Education" />
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#1a202c' }}>MIT, Manipal</div>
          <div style={{ fontSize: 8, color: '#718096', fontStyle: 'italic', marginTop: 2 }}>B.Tech Computer Science</div>
        </div>
      </motion.div>
    </div>
  </div>
));

// ─── Interactive dots background (hero) ───────────────────────────────────────

interface Dot { x: number; y: number; vx: number; vy: number; r: number; }

const DotsBackground: React.FC = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const dotsRef   = useRef<Dot[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    let animId   = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      // Re-seed dots on resize so they fill new bounds
      dotsRef.current = Array.from({ length: 70 }, () => ({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r:  Math.random() * 1.2 + 0.4,
      }));
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouseRef.current;
      const dots = dotsRef.current;

      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = canvas.width;
        if (d.x > canvas.width) d.x = 0;
        if (d.y < 0) d.y = canvas.height;
        if (d.y > canvas.height) d.y = 0;

        const dx = d.x - mx, dy = d.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          const f = (120 - dist) / 120 * 0.6;
          d.x += (dx / dist) * f; d.y += (dy / dist) * f;
        }

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139,92,246,0.55)';
        ctx.fill();
      }

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.12 * (1 - d / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };

    resize();
    animate();

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    // Scope to canvas only — no need to track mouse outside the hero section
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  );
});

// ─── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({ config, onSelect }: { config: TemplateConfig; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const Preview = TEMPLATE_PREVIEWS[config.id];

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="template-card group h-full flex flex-col" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* Preview — fixed height */}
      <div className="h-52 bg-white overflow-hidden relative border-b border-gray-100 flex-shrink-0">
        <div className="absolute inset-0 overflow-hidden">
          {Preview
            ? <Preview accent={config.accentColor} />
            : (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: config.accentColor + '15' }}>
                  <FileText size={16} style={{ color: config.accentColor }} />
                </div>
              </div>
            )
          }
        </div>
        {/* Hover overlay */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: config.accentColor + 'CC', backdropFilter: 'blur(4px)' }}>
          <button onClick={onSelect}
            className="flex items-center gap-2 bg-white text-gray-900 font-semibold px-5 py-2.5 rounded-xl text-sm shadow-lg hover:scale-105 transition-transform">
            Use Template <ArrowRight size={15} />
          </button>
        </motion.div>
      </div>
      {/* Info — grows to fill remaining height so all cards align at the bottom */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-gray-900 text-sm">{config.name}</h3>
          <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ background: config.accentColor }} />
        </div>
        <p className="text-xs text-gray-500 mb-3 leading-snug line-clamp-2 flex-1">{config.description}</p>
        <div className="flex flex-wrap gap-1">
          {config.tags.map(tag => (
            <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{tag}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const FEATURES = [
  { icon: Zap,      color: '#f59e0b', title: 'Instant editing',        desc: 'Click any text on your resume to edit it directly. Changes appear in real-time.' },
  { icon: Shield,   color: '#22c55e', title: 'No account needed',      desc: 'Your resume stays in your browser. No signup, no data stored on our servers.' },
  { icon: Sparkles, color: '#8b5cf6', title: '10 pro templates',       desc: 'Carefully crafted templates for every industry and career level.' },
  { icon: Users,    color: '#f43f5e', title: 'ATS-friendly formats',   desc: "Jake's Resume and ModernCV are optimised to pass ATS screening systems." },
  { icon: Upload,   color: '#6366f1', title: 'Perfect PDF export',     desc: 'Download a pixel-perfect PDF that looks exactly like your preview.' },
  { icon: Download, color: '#14b8a6', title: 'PDF text editor',        desc: 'Upload a PDF to edit it directly as text. Opens in the built-in PDF editor — no re-formatting needed.' },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { setTemplate } = useResumeStore();
  const { setPdfFile } = usePDFEditorStore();
  const [filter, setFilter] = useState<string>('all');
  const featuresRef = useRef<HTMLDivElement>(null);
  const templatesRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: '-100px' });
  const templatesInView = useInView(templatesRef, { once: true, margin: '-80px' });

  const handleSelectTemplate = (id: TemplateId) => {
    setTemplate(id);
    navigate('/editor');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (importRef.current) importRef.current.value = '';
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File must be under 20 MB.');
      return;
    }
    setPdfFile(file);
    navigate('/pdf-editor');
  };

  const categories = ['all', 'professional', 'creative', 'academic'];
  const filtered = filter === 'all' ? templateConfigs : templateConfigs.filter(t => t.category === filter);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <FileText size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">FreeCV</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => templatesRef.current?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-gray-600 hover:text-gray-900 font-medium hidden sm:block">Templates</button>
          <button onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-gray-600 hover:text-gray-900 font-medium hidden sm:block">Features</button>
          <button onClick={() => navigate('/editor')} className="btn-primary text-sm py-2 px-4">
            Open Editor <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center pt-20 pb-16 px-6 lg:px-16 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1040 50%, #0a0a1a 100%)' }}>
        <DotsBackground />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: '#6366f1' }} />
          <div className="absolute bottom-10 right-1/3 w-72 h-72 rounded-full opacity-15 blur-3xl" style={{ background: '#8b5cf6' }} />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full opacity-10 blur-3xl" style={{ background: '#06b6d4' }} />
        </div>

        <div className="max-w-6xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* LEFT — content */}
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-sm text-indigo-300 mb-8">
              <Sparkles size={14} className="text-indigo-400" />
              No signup · Free forever · Your data stays local
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-5xl sm:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
              <span className="block mb-3">Build your dream</span>
              <span className="gradient-text block">in minutes</span>
            </motion.h1>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-3 mb-8" style={{ maxWidth: 460 }}>
              {[
                { icon: FileText, label: 'Pro resume templates' },
                { icon: Zap,      label: 'Live editing'         },
                { icon: Upload,   label: 'Perfect PDF export'   },
                { icon: Shield,   label: 'Completely Free'      },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm text-gray-200 text-sm font-medium justify-center">
                  <Icon size={15} className="text-indigo-400 flex-shrink-0" />
                  {label}
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="flex items-center gap-4 mb-10 flex-wrap">
              <button onClick={() => templatesRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all text-base shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5">
                Choose a Template <ArrowRight size={16} />
              </button>
              <div>
                <input ref={importRef} type="file" accept=".pdf" onChange={handleImport} style={{ display: 'none' }} />
                <button onClick={() => importRef.current?.click()}
                  className="flex items-center gap-2 glass hover:bg-white/10 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all text-base">
                  <Upload size={16} /> Import My Resume
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="flex items-center gap-8 text-sm text-gray-500">
              {[['10', 'Templates'], ['∞', 'Downloads'], ['0', 'Cost'], ['100%', 'Private']].map(([num, label]) => (
                <div key={label} className="text-center">
                  <div className="text-xl font-bold text-white">{num}</div>
                  <div className="text-xs">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — animated resume */}
          <div className="hidden lg:flex items-center justify-center">
            <ResumeAnimation />
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <button onClick={() => templatesRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="text-gray-500 hover:text-gray-300 transition-colors animate-bounce">
            <ChevronDown size={24} />
          </button>
        </motion.div>
      </section>

      {/* Template Gallery */}
      <section ref={templatesRef} className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={templatesInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
            className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Choose your template</h2>
            <p className="text-gray-500">Professionally designed for every career stage and industry</p>
          </motion.div>

          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${filter === cat ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filtered.map((config, i) => (
              <motion.div key={config.id} className="h-full" initial={{ opacity: 0, y: 20 }} animate={templatesInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.07 }}>
                <TemplateCard config={config} onSelect={() => handleSelectTemplate(config.id as TemplateId)} />
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={templatesInView ? { opacity: 1 } : {}} transition={{ delay: 0.4 }}
            className="text-center mt-8">
            <button onClick={() => navigate('/editor')} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors underline underline-offset-2">
              Or continue editing your current resume →
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
            className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need. Nothing you don't.</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Built for job seekers who want results, not subscriptions.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.07 }}
                className="p-5 rounded-2xl shadow-md hover:shadow-xl transition-all bg-white group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110" style={{ background: f.color + '15' }}>
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-6" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star size={18} className="text-yellow-300 fill-yellow-300" />
              <span className="text-indigo-200 text-sm font-medium">Join thousands of job seekers</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Ready to land your dream job?</h2>
            <p className="text-indigo-200 mb-6 text-lg">Create your resume in minutes. Completely free.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => templatesRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-2xl text-base hover:bg-gray-50 transition-all shadow-lg hover:-translate-y-0.5">
                Get Started Free <ArrowRight size={16} />
              </button>
            </div>
            <div className="flex items-center justify-center gap-5 mt-6 text-sm text-indigo-200">
              {['No credit card', 'No signup', 'Download unlimited PDFs'].map(t => (
                <div key={t} className="flex items-center gap-1.5">
                  <Check size={14} className="text-green-400" />
                  {t}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FileText size={12} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">FreeCV</span>
          </div>
          <p className="text-sm text-gray-400">Free forever · No account needed · Your data stays in your browser</p>
          <p className="text-sm text-gray-400">&copy; 2026 Adarsh Ranjan</p>
        </div>
      </footer>
    </div>
  );
};

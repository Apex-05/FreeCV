/**
 * Jake Resume: ATS-optimised single column.
 * Centered header · pipe-separated contact · small-caps section rules.
 */
import React from 'react';
import type { ResumeData } from '../../../../types/resume';
import { EditableField, EditableBullet } from '../EditableField';
import { useResumeStore } from '../../../../store/resumeStore';
import { Plus, Trash2 } from 'lucide-react';
import { CustomSectionBlock } from '../shared/CustomSectionBlock';
import { PhotoUpload } from '../shared/PhotoUpload';

interface Props { data: ResumeData; isPrinting: boolean }

export const JakeTemplate: React.FC<Props> = ({ data, isPrinting }) => {
  const store = useResumeStore.getState();
  const { settings, personalInfo, sections } = data;
  const fs = settings.fontSize;
  const gap: React.CSSProperties = { marginTop: settings.sectionSpacing * 3 + 6 + 'px' };

  const Add = ({ onClick, label }: { onClick: () => void; label: string }) =>
    isPrinting ? null : (
      <button onClick={onClick} className="no-print" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 11, padding: '2px 0', display: 'flex', alignItems: 'center', gap: 3 }}>
        <Plus size={11} /> {label}
      </button>
    );

  const Del = ({ onClick }: { onClick: () => void }) =>
    isPrinting ? null : (
      <button onClick={onClick} className="no-print opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '0 3px', flexShrink: 0, marginLeft: 2 }}>
        <Trash2 size={11} />
      </button>
    );

  const HR = ({ id, label }: { id?: string; label: string }) => {
    const lbl = id ? (sections.find(s => s.id === id)?.label ?? label) : label;
    return (
      <div style={{ marginBottom: 5 }}>
        <h2 style={{ fontSize: fs + 1 + 'px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#111', margin: '0 0 2px', paddingBottom: 3, borderBottom: '1px solid #111' }}>
          {!isPrinting && id
            ? <EditableField value={lbl} onChange={v => store.updateSection(id, { label: v })} style={{ display: 'inline' }} />
            : <span>{lbl}</span>}
        </h2>
      </div>
    );
  };

  const dateStr = (s: string, e: string) => [s, e].filter(Boolean).join(' – ');

  const root: React.CSSProperties = {
    fontFamily: settings.fontFamily + ', "Times New Roman", Georgia, serif',
    fontSize: fs + 'px',
    lineHeight: settings.lineHeight,
    padding: `${settings.topMargin * 4 + 6}px 40px 40px`,
    color: '#111',
    background: '#fff',
  };

  const visibleLinks = personalInfo.contactLinks.filter(l => l.visible && l.value.trim());

  return (
    <div style={root}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, justifyContent: 'space-between' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <EditableField value={personalInfo.name} onChange={v => store.updatePersonalInfo('name', v)}
              style={{ fontSize: fs + 14 + 'px', fontWeight: 800, letterSpacing: '0.02em', display: 'block', marginBottom: 3, color: '#111' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '3px 6px', fontSize: fs - 1 + 'px' }}>
              {visibleLinks.map((lk, i) => (
                <React.Fragment key={lk.id}>
                  {i > 0 && <span style={{ color: '#aaa' }}>|</span>}
                  <EditableField value={lk.value} onChange={v => store.updateContactLink(lk.id, { value: v })} style={{ color: '#374151' }} />
                </React.Fragment>
              ))}
            </div>
          </div>
          <PhotoUpload size={64} isPrinting={isPrinting} />
        </div>
      </div>

      {/* ── Sections (ordered by data.sections) ── */}
      {sections.map(sec => {
        if (sec.visible === false) return null;
        switch (sec.id) {
          case 'education': return (
            <div key="education" style={gap}>
              <HR id="education" label="Education" />
              {data.education.map(edu => (
                <div key={edu.id} className="group" style={{ marginBottom: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <EditableField value={edu.institution} onChange={v => store.updateEducation(edu.id, 'institution', v)} style={{ fontWeight: 700 }} />
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <EditableField value={edu.location} onChange={v => store.updateEducation(edu.id, 'location', v)} style={{ fontSize: fs - 1 + 'px', color: '#555', flexShrink: 0 }} />
                      <Del onClick={() => store.removeEducation(edu.id)} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <EditableField value={edu.degree} onChange={v => store.updateEducation(edu.id, 'degree', v)} style={{ fontStyle: 'italic', color: '#333' }} />
                    <EditableField value={dateStr(edu.startDate, edu.endDate)} onChange={v => { const [s, ...rest] = v.split(/\s*[–-]\s*/); store.updateEducation(edu.id, 'startDate', s?.trim() ?? ''); store.updateEducation(edu.id, 'endDate', rest.join('').trim()); }} style={{ fontStyle: 'italic', fontSize: fs - 1 + 'px', color: '#555', flexShrink: 0 }} />
                  </div>
                  {edu.gpa && <EditableField value={edu.gpa} onChange={v => store.updateEducation(edu.id, 'gpa', v)} style={{ fontSize: fs - 1 + 'px', color: '#555' }} />}
                </div>
              ))}
              <Add onClick={() => store.addEducation()} label="+ Add education" />
            </div>
          );
          case 'experience': return (
            <div key="experience" style={gap}>
              <HR id="experience" label="Experience" />
              {data.experience.map(exp => (
                <div key={exp.id} className="group" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <EditableField value={exp.company} onChange={v => store.updateExperience(exp.id, 'company', v)} style={{ fontWeight: 700 }} />
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <EditableField value={dateStr(exp.startDate, exp.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateExperience(exp.id, 'startDate', s?.trim() ?? ''); store.updateExperience(exp.id, 'endDate', r.join('').trim()); }} style={{ fontSize: fs - 1 + 'px', color: '#555', flexShrink: 0 }} />
                      <Del onClick={() => store.removeExperience(exp.id)} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <EditableField value={exp.title} onChange={v => store.updateExperience(exp.id, 'title', v)} style={{ fontStyle: 'italic', fontSize: fs - 0.5 + 'px', color: '#333' }} />
                    <EditableField value={exp.location} onChange={v => store.updateExperience(exp.id, 'location', v)} style={{ fontStyle: 'italic', fontSize: fs - 1 + 'px', color: '#555', flexShrink: 0 }} />
                  </div>
                  <div style={{ paddingLeft: 14, marginTop: 2 }}>
                    {exp.bullets.map((b, bi) => (
                      <EditableBullet key={bi} value={b} accentColor="#111" onChange={v => store.updateExperienceBullet(exp.id, bi, v)} onRemove={() => store.removeExperienceBullet(exp.id, bi)} isPrinting={isPrinting} onAddNext={() => store.addExperienceBullet(exp.id)} />
                    ))}
                    <Add onClick={() => store.addExperienceBullet(exp.id)} label="+ Add bullet" />
                  </div>
                </div>
              ))}
              <Add onClick={() => store.addExperience()} label="+ Add experience" />
            </div>
          );
          case 'projects': return (
            <div key="projects" style={gap}>
              <HR id="projects" label="Projects" />
              {data.projects.map(proj => (
                <div key={proj.id} className="group" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span>
                      <EditableField value={proj.name} onChange={v => store.updateProject(proj.id, 'name', v)} style={{ fontWeight: 700 }} />
                      {proj.technologies && <><span style={{ color: '#555' }}> | </span><EditableField value={proj.technologies} onChange={v => store.updateProject(proj.id, 'technologies', v)} style={{ fontStyle: 'italic', color: '#333' }} /></>}
                    </span>
                    <Del onClick={() => store.removeProject(proj.id)} />
                  </div>
                  <div style={{ paddingLeft: 14, marginTop: 2 }}>
                    {proj.bullets.map((b, bi) => (
                      <EditableBullet key={bi} value={b} accentColor="#111" onChange={v => store.updateProjectBullet(proj.id, bi, v)} onRemove={() => store.removeProjectBullet(proj.id, bi)} isPrinting={isPrinting} onAddNext={() => store.addProjectBullet(proj.id)} />
                    ))}
                    <Add onClick={() => store.addProjectBullet(proj.id)} label="+ Add bullet" />
                  </div>
                </div>
              ))}
              <Add onClick={() => store.addProject()} label="+ Add project" />
            </div>
          );
          case 'skills': return (
            <div key="skills" style={gap}>
              <HR id="skills" label="Technical Skills" />
              {data.skills.map(sk => (
                <div key={sk.id} className="group" style={{ marginBottom: 3, display: 'flex', alignItems: 'baseline', gap: 3, flexWrap: 'wrap' }}>
                  <EditableField value={sk.category} onChange={v => store.updateSkillCategory(sk.id, 'category', v)} style={{ fontWeight: 700 }} />
                  <span style={{ fontWeight: 700 }}>:</span>
                  <EditableField value={sk.skills} onChange={v => store.updateSkillCategory(sk.id, 'skills', v)} style={{ fontSize: fs - 0.5 + 'px', color: '#374151', flex: 1 }} />
                  <Del onClick={() => store.removeSkillCategory(sk.id)} />
                </div>
              ))}
              <Add onClick={() => store.addSkillCategory()} label="+ Add skill category" />
            </div>
          );
          case 'certifications': return data.certifications.length > 0 ? (
            <div key="certifications" style={gap}>
              <HR id="certifications" label="Certifications" />
              {data.certifications.map(c => (
                <div key={c.id} className="group" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <EditableField value={c.name} onChange={v => store.updateCertification(c.id, 'name', v)} style={{ fontWeight: 600 }} />
                    <EditableField value={c.issuer} onChange={v => store.updateCertification(c.id, 'issuer', v)} style={{ color: '#555' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <EditableField value={c.date} onChange={v => store.updateCertification(c.id, 'date', v)} style={{ fontSize: fs - 1 + 'px', color: '#555', flexShrink: 0 }} />
                    <Del onClick={() => store.removeCertification(c.id)} />
                  </div>
                </div>
              ))}
              <Add onClick={() => store.addCertification()} label="+ Add certification" />
            </div>
          ) : null;
          case 'summary': return (
            <div key="summary" style={gap}>
              <HR id="summary" label="Summary" />
              <EditableField value={data.summary} onChange={v => store.updateSummary(v)} multiline style={{ color: '#374151', display: 'block' }} />
            </div>
          );
          default: {
            const cs = data.customSections.find(c => c.id === sec.id);
            return cs ? (
              <CustomSectionBlock key={cs.id} section={cs} accentColor="#111" fontSize={fs} lineHeight={settings.lineHeight} sectionSpacing={settings.sectionSpacing} isPrinting={isPrinting} headerElement={<HR label={cs.title} />} />
            ) : null;
          }
        }
      })}
    </div>
  );
};

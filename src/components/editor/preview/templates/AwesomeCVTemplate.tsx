/**
 * Awesome-CV — Tech · Colored header · icon contact row · accent section bars.
 */
import React from 'react';
import type { ResumeData } from '../../../../types/resume';
import { EditableField, EditableBullet } from '../EditableField';
import { useResumeStore } from '../../../../store/resumeStore';
import { Plus, Trash2 } from 'lucide-react';
import { ContactRow } from '../shared/ContactRow';
import { CustomSectionBlock } from '../shared/CustomSectionBlock';
import { PhotoUpload } from '../shared/PhotoUpload';

interface Props { data: ResumeData; isPrinting: boolean }

export const AwesomeCVTemplate: React.FC<Props> = ({ data, isPrinting }) => {
  const store = useResumeStore.getState();
  const { settings, personalInfo, sections } = data;
  const acc = settings.accentColor;
  const fs = settings.fontSize;
  const gap: React.CSSProperties = { marginTop: settings.sectionSpacing * 4 + 'px' };

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

  const SH = ({ id, label }: { id?: string; label: string }) => {
    const lbl = id ? (sections.find(s => s.id === id)?.label ?? label) : label;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 3, height: 18, background: acc, borderRadius: 2, flexShrink: 0 }} />
        <h2 style={{ fontSize: fs + 3 + 'px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1a202c', margin: 0 }}>
          {!isPrinting && id
            ? <EditableField value={lbl} onChange={v => store.updateSection(id, { label: v })} style={{ display: 'inline' }} />
            : <span>{lbl}</span>}
        </h2>
        <div style={{ flex: 1, height: 1, background: acc + '40' }} />
      </div>
    );
  };

  const dateStr = (s: string, e: string) => [s, e].filter(Boolean).join(' – ');

  return (
    <div style={{ fontFamily: settings.fontFamily + ', "Lato", sans-serif', fontSize: fs + 'px', lineHeight: settings.lineHeight, background: '#fff', color: '#2d3748' }}>
      {/* ── Colored Header ── */}
      <div style={{ background: '#2d3748', padding: `${settings.topMargin * 4 + 24}px 48px 20px`, marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <EditableField value={personalInfo.name} onChange={v => store.updatePersonalInfo('name', v)}
              style={{ fontSize: fs + 18 + 'px', fontWeight: 900, letterSpacing: '0.08em', color: '#fff', display: 'block', marginBottom: 4, textTransform: 'uppercase' }} />
            <EditableField value={personalInfo.title} onChange={v => store.updatePersonalInfo('title', v)} placeholder="Your Position / Title"
              style={{ fontSize: fs + 3 + 'px', color: acc, fontWeight: 300, letterSpacing: '0.12em', display: 'block', marginBottom: 12 }} />
            <ContactRow accent={acc} fontSize={fs} isPrinting={isPrinting} style={{ justifyContent: 'center', color: '#cbd5e0' }} iconColor={acc} separator="·" />
          </div>
          <PhotoUpload size={72} isPrinting={isPrinting} />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '16px 48px 48px' }}>
        {sections.map(sec => {
          if (sec.visible === false) return null;
          switch (sec.id) {
            case 'summary': return (
              <div key="summary" style={gap}>
                <SH id="summary" label="Profile" />
                <EditableField value={data.summary} onChange={v => store.updateSummary(v)} multiline style={{ color: '#4a5568', display: 'block', lineHeight: '1.7' }} />
              </div>
            );
            case 'experience': return (
              <div key="experience" style={gap}>
                <SH id="experience" label="Experience" />
                {data.experience.map(exp => (
                  <div key={exp.id} className="group" style={{ marginBottom: 14, paddingLeft: 12, borderLeft: `2px solid ${acc}20` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <EditableField value={exp.title} onChange={v => store.updateExperience(exp.id, 'title', v)} style={{ fontWeight: 700, fontSize: fs + 1 + 'px', color: '#1a202c' }} />
                        <span style={{ color: acc, fontWeight: 600, margin: '0 6px', fontSize: fs + 'px' }}>@</span>
                        <EditableField value={exp.company} onChange={v => store.updateExperience(exp.id, 'company', v)} style={{ fontWeight: 600, color: acc, fontSize: fs + 1 + 'px' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: 8 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: fs - 1 + 'px', color: '#718096', fontStyle: 'italic' }}>
                            <EditableField value={dateStr(exp.startDate, exp.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateExperience(exp.id, 'startDate', s?.trim() ?? ''); store.updateExperience(exp.id, 'endDate', r.join('').trim()); }} />
                          </div>
                          <div style={{ fontSize: fs - 1 + 'px', color: '#a0aec0' }}>
                            <EditableField value={exp.location} onChange={v => store.updateExperience(exp.id, 'location', v)} />
                          </div>
                        </div>
                        <Del onClick={() => store.removeExperience(exp.id)} />
                      </div>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {exp.bullets.map((b, bi) => (
                        <EditableBullet key={bi} value={b} accentColor={acc} onChange={v => store.updateExperienceBullet(exp.id, bi, v)} onRemove={() => store.removeExperienceBullet(exp.id, bi)} isPrinting={isPrinting} onAddNext={() => store.addExperienceBullet(exp.id)} />
                      ))}
                      <Add onClick={() => store.addExperienceBullet(exp.id)} label="+ Add bullet" />
                    </div>
                  </div>
                ))}
                <Add onClick={() => store.addExperience()} label="+ Add experience" />
              </div>
            );
            case 'education': return (
              <div key="education" style={gap}>
                <SH id="education" label="Education" />
                {data.education.map(edu => (
                  <div key={edu.id} className="group" style={{ marginBottom: 12, paddingLeft: 12, borderLeft: `2px solid ${acc}20` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <EditableField value={edu.institution} onChange={v => store.updateEducation(edu.id, 'institution', v)} style={{ fontWeight: 700, fontSize: fs + 1 + 'px', color: '#1a202c' }} />
                        <div><EditableField value={edu.degree} onChange={v => store.updateEducation(edu.id, 'degree', v)} style={{ color: '#4a5568', fontStyle: 'italic' }} /></div>
                        {edu.gpa && <div style={{ fontSize: fs - 1 + 'px', color: acc }}><EditableField value={`GPA: ${edu.gpa}`} onChange={v => store.updateEducation(edu.id, 'gpa', v.replace('GPA: ', ''))} /></div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: 8, textAlign: 'right' }}>
                        <div>
                          <div style={{ fontSize: fs - 1 + 'px', color: '#718096', fontStyle: 'italic' }}><EditableField value={dateStr(edu.startDate, edu.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateEducation(edu.id, 'startDate', s?.trim() ?? ''); store.updateEducation(edu.id, 'endDate', r.join('').trim()); }} /></div>
                          <div style={{ fontSize: fs - 1 + 'px', color: '#a0aec0' }}><EditableField value={edu.location} onChange={v => store.updateEducation(edu.id, 'location', v)} /></div>
                        </div>
                        <Del onClick={() => store.removeEducation(edu.id)} />
                      </div>
                    </div>
                  </div>
                ))}
                <Add onClick={() => store.addEducation()} label="+ Add education" />
              </div>
            );
            case 'projects': return (
              <div key="projects" style={gap}>
                <SH id="projects" label="Projects" />
                {data.projects.map(proj => (
                  <div key={proj.id} className="group" style={{ marginBottom: 12, paddingLeft: 12, borderLeft: `2px solid ${acc}20` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span>
                        <EditableField value={proj.name} onChange={v => store.updateProject(proj.id, 'name', v)} style={{ fontWeight: 700, color: '#1a202c' }} />
                        {proj.technologies && <><span style={{ color: '#718096', margin: '0 4px' }}>·</span><EditableField value={proj.technologies} onChange={v => store.updateProject(proj.id, 'technologies', v)} style={{ color: acc, fontSize: fs - 0.5 + 'px' }} /></>}
                      </span>
                      <Del onClick={() => store.removeProject(proj.id)} />
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {proj.bullets.map((b, bi) => (
                        <EditableBullet key={bi} value={b} accentColor={acc} onChange={v => store.updateProjectBullet(proj.id, bi, v)} onRemove={() => store.removeProjectBullet(proj.id, bi)} isPrinting={isPrinting} onAddNext={() => store.addProjectBullet(proj.id)} />
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
                <SH id="skills" label="Skills" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 24px' }}>
                  {data.skills.map(sk => (
                    <div key={sk.id} className="group" style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <EditableField value={sk.category} onChange={v => store.updateSkillCategory(sk.id, 'category', v)} style={{ fontWeight: 700, color: acc, fontSize: fs - 0.5 + 'px' }} />
                      <span style={{ color: '#718096' }}>·</span>
                      <EditableField value={sk.skills} onChange={v => store.updateSkillCategory(sk.id, 'skills', v)} style={{ color: '#4a5568', fontSize: fs - 0.5 + 'px' }} />
                      <Del onClick={() => store.removeSkillCategory(sk.id)} />
                    </div>
                  ))}
                </div>
                <Add onClick={() => store.addSkillCategory()} label="+ Add skill" />
              </div>
            );
            case 'certifications': return data.certifications.length > 0 ? (
              <div key="certifications" style={gap}>
                <SH id="certifications" label="Certifications" />
                {data.certifications.map(c => (
                  <div key={c.id} className="group" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <EditableField value={c.name} onChange={v => store.updateCertification(c.id, 'name', v)} style={{ fontWeight: 600, color: '#1a202c' }} />
                      {c.issuer && <span style={{ color: '#718096' }}>·</span>}<EditableField value={c.issuer} onChange={v => store.updateCertification(c.id, 'issuer', v)} style={{ color: '#718096' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <EditableField value={c.date} onChange={v => store.updateCertification(c.id, 'date', v)} style={{ fontSize: fs - 1 + 'px', color: '#a0aec0', flexShrink: 0 }} />
                      <Del onClick={() => store.removeCertification(c.id)} />
                    </div>
                  </div>
                ))}
                <Add onClick={() => store.addCertification()} label="+ Add certification" />
              </div>
            ) : null;
            default: {
              const cs = data.customSections.find(c => c.id === sec.id);
              return cs ? (
                <CustomSectionBlock key={cs.id} section={cs} accentColor={acc} fontSize={fs} lineHeight={settings.lineHeight} sectionSpacing={settings.sectionSpacing} isPrinting={isPrinting} headerElement={<SH label={cs.title} />} />
              ) : null;
            }
          }
        })}
      </div>
    </div>
  );
};

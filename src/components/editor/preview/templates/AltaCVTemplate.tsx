/**
 * AltaCV — Product / PM · Two-column 60/40 · Icon-rich header · Skill rating dots.
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

export const AltaCVTemplate: React.FC<Props> = ({ data, isPrinting }) => {
  const store = useResumeStore.getState();
  const { settings, personalInfo, sections } = data;
  const acc = settings.accentColor;
  const fs = settings.fontSize;

  const Add = ({ onClick, label }: { onClick: () => void; label: string }) =>
    isPrinting ? null : (
      <button onClick={onClick} className="no-print" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 11, padding: '2px 0', display: 'flex', alignItems: 'center', gap: 3 }}>
        <Plus size={11} /> {label}
      </button>
    );
  const Del = ({ onClick }: { onClick: () => void }) =>
    isPrinting ? null : (
      <button onClick={onClick} className="no-print opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '0 3px', marginLeft: 2, flexShrink: 0 }}>
        <Trash2 size={11} />
      </button>
    );

  const LSH = ({ id, label }: { id?: string; label: string }) => {
    const lbl = id ? (sections.find(s => s.id === id)?.label ?? label) : label;
    return (
      <h3 style={{ fontSize: fs + 1 + 'px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1a202c', margin: '0 0 8px', paddingBottom: 4, borderBottom: `1.5px solid ${acc}` }}>
        {!isPrinting && id
          ? <EditableField value={lbl} onChange={v => store.updateSection(id, { label: v })} style={{ display: 'inline' }} />
          : <span>{lbl}</span>}
      </h3>
    );
  };
  const RSH = ({ id, label }: { id?: string; label: string }) => {
    const lbl = id ? (sections.find(s => s.id === id)?.label ?? label) : label;
    return (
      <h2 style={{ fontSize: fs + 3 + 'px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1a202c', margin: '0 0 8px', paddingBottom: 5, borderBottom: `2px solid ${acc}` }}>
        {!isPrinting && id
          ? <EditableField value={lbl} onChange={v => store.updateSection(id, { label: v })} style={{ display: 'inline' }} />
          : <span>{lbl}</span>}
      </h2>
    );
  };

  // Skill dot rating — click a dot to set level, click the filled dot again to decrement
  const SkillDots = ({ skillId, level = 3, max = 5 }: { skillId: string; level?: number; max?: number }) => (
    <div style={{ display: 'flex', gap: 3, marginLeft: 6 }}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          onClick={isPrinting ? undefined : () => store.updateSkillLevel(skillId, i + 1 === level ? Math.max(1, level - 1) : i + 1)}
          style={{ width: 7, height: 7, borderRadius: '50%', background: i < level ? acc : acc + '30', cursor: isPrinting ? 'default' : 'pointer', flexShrink: 0 }}
        />
      ))}
    </div>
  );

  const dateStr = (s: string, e: string) => [s, e].filter(Boolean).join(' – ');

  return (
    <div style={{ fontFamily: settings.fontFamily + ', sans-serif', fontSize: fs + 'px', lineHeight: settings.lineHeight, background: '#fff', color: '#2d3748' }}>
      {/* ── Full-width header ── */}
      <div style={{ background: `linear-gradient(135deg, ${acc}18 0%, ${acc}08 100%)`, borderBottom: `3px solid ${acc}`, padding: `${settings.topMargin * 4 + 16}px 32px 16px` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <PhotoUpload size={68} isPrinting={isPrinting} />
            <div>
              <EditableField value={personalInfo.name} onChange={v => store.updatePersonalInfo('name', v)}
                style={{ fontSize: fs + 20 + 'px', fontWeight: 900, color: '#1a202c', display: 'block', letterSpacing: '-0.01em' }} />
              <EditableField value={personalInfo.title} onChange={v => store.updatePersonalInfo('title', v)} placeholder="Product Manager / Role"
                style={{ fontSize: fs + 2 + 'px', color: acc, fontWeight: 500, display: 'block', marginTop: 2 }} />
            </div>
          </div>
          <div style={{ marginTop: 4 }}>
            <ContactRow accent={acc} fontSize={fs} isPrinting={isPrinting} layout="column" style={{ alignItems: 'flex-end', color: '#4a5568' }} />
          </div>
        </div>
      </div>

      {/* ── Two columns ── */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Left 62% — summary, experience, projects, custom (ordered by data.sections) */}
        <div style={{ width: '62%', padding: '16px 20px 40px 32px', borderRight: `1px solid #e2e8f0` }}>
          {sections.filter(s => !['education', 'skills', 'certifications'].includes(s.id)).map(sec => {
            if (sec.visible === false) return null;
            switch (sec.id) {
              case 'summary': return (
                <div key="summary" style={{ marginBottom: 16 }}>
                  <RSH id="summary" label="Profile" />
                  <EditableField value={data.summary} onChange={v => store.updateSummary(v)} multiline style={{ color: '#4a5568', display: 'block', lineHeight: '1.65' }} />
                </div>
              );
              case 'experience': return (
                <div key="experience" style={{ marginBottom: 16 }}>
                  <RSH id="experience" label="Experience" />
                  {data.experience.map(exp => (
                    <div key={exp.id} className="group" style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <EditableField value={exp.title} onChange={v => store.updateExperience(exp.id, 'title', v)} style={{ fontWeight: 800, fontSize: fs + 1 + 'px', color: '#1a202c' }} />
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 1 }}>
                            <EditableField value={exp.company} onChange={v => store.updateExperience(exp.id, 'company', v)} style={{ fontWeight: 600, color: acc }} />
                            {exp.location && <span style={{ color: '#cbd5e0' }}>·</span>}<EditableField value={exp.location} onChange={v => store.updateExperience(exp.id, 'location', v)} style={{ color: '#718096', fontSize: fs - 1 + 'px' }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right', fontSize: fs - 1.5 + 'px', color: '#a0aec0', fontStyle: 'italic' }}>
                            <EditableField value={dateStr(exp.startDate, exp.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateExperience(exp.id, 'startDate', s?.trim() ?? ''); store.updateExperience(exp.id, 'endDate', r.join('').trim()); }} />
                          </div>
                          <Del onClick={() => store.removeExperience(exp.id)} />
                        </div>
                      </div>
                      <div style={{ marginTop: 6, paddingLeft: 2 }}>
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
              case 'projects': return (
                <div key="projects" style={{ marginBottom: 16 }}>
                  <RSH id="projects" label="Projects" />
                  {data.projects.map(proj => (
                    <div key={proj.id} className="group" style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span>
                          <EditableField value={proj.name} onChange={v => store.updateProject(proj.id, 'name', v)} style={{ fontWeight: 700, color: '#1a202c' }} />
                          {proj.technologies && <><span style={{ color: '#cbd5e0', margin: '0 4px' }}>|</span><EditableField value={proj.technologies} onChange={v => store.updateProject(proj.id, 'technologies', v)} style={{ fontStyle: 'italic', color: '#718096', fontSize: fs - 0.5 + 'px' }} /></>}
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
              default: {
                const cs = data.customSections.find(c => c.id === sec.id);
                return cs ? (
                  <div key={cs.id} style={{ marginBottom: 16 }}>
                    <CustomSectionBlock section={cs} accentColor={acc} fontSize={fs} lineHeight={settings.lineHeight} sectionSpacing={settings.sectionSpacing} isPrinting={isPrinting} headerElement={<RSH label={cs.title} />} />
                  </div>
                ) : null;
              }
            }
          })}
        </div>

        {/* Right 38% — education, skills, certifications (ordered by data.sections) */}
        <div style={{ flex: 1, padding: '16px 24px 40px 20px' }}>
          {sections.filter(s => ['education', 'skills', 'certifications'].includes(s.id)).map(sec => {
            if (sec.visible === false) return null;
            switch (sec.id) {
              case 'education': return (
                <div key="education" style={{ marginBottom: 16 }}>
                  <LSH id="education" label="Education" />
                  {data.education.map(edu => (
                    <div key={edu.id} className="group" style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <EditableField value={edu.institution} onChange={v => store.updateEducation(edu.id, 'institution', v)} style={{ fontWeight: 700, color: '#1a202c', fontSize: fs + 'px' }} />
                        <Del onClick={() => store.removeEducation(edu.id)} />
                      </div>
                      <EditableField value={edu.degree} onChange={v => store.updateEducation(edu.id, 'degree', v)} style={{ fontStyle: 'italic', color: '#4a5568', display: 'block', fontSize: fs - 0.5 + 'px' }} />
                      <div style={{ fontSize: fs - 1.5 + 'px', color: '#a0aec0', display: 'flex', gap: 6 }}>
                        <EditableField value={dateStr(edu.startDate, edu.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateEducation(edu.id, 'startDate', s?.trim() ?? ''); store.updateEducation(edu.id, 'endDate', r.join('').trim()); }} />
                        {edu.location && <span>·</span>}<EditableField value={edu.location} onChange={v => store.updateEducation(edu.id, 'location', v)} />
                      </div>
                      {edu.gpa && <div style={{ fontSize: fs - 1 + 'px', color: acc }}><EditableField value={`GPA ${edu.gpa}`} onChange={v => store.updateEducation(edu.id, 'gpa', v.replace('GPA ', ''))} /></div>}
                    </div>
                  ))}
                  <Add onClick={() => store.addEducation()} label="+ Add education" />
                </div>
              );
              case 'skills': return (
                <div key="skills" style={{ marginBottom: 16 }}>
                  <LSH id="skills" label="Skills" />
                  {data.skills.map((sk, i) => (
                    <div key={sk.id} className="group" style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <EditableField value={sk.category || sk.skills} onChange={v => store.updateSkillCategory(sk.id, sk.category ? 'category' : 'skills', v)} style={{ fontSize: fs - 0.5 + 'px', fontWeight: 600, color: '#1a202c' }} />
                          <SkillDots skillId={sk.id} level={sk.level ?? Math.min(5, Math.max(2, 5 - (i % 3)))} />
                        </div>
                        <Del onClick={() => store.removeSkillCategory(sk.id)} />
                      </div>
                      {sk.category && sk.skills && (
                        <EditableField value={sk.skills} onChange={v => store.updateSkillCategory(sk.id, 'skills', v)} style={{ fontSize: fs - 1.5 + 'px', color: '#718096', display: 'block' }} />
                      )}
                    </div>
                  ))}
                  <Add onClick={() => store.addSkillCategory()} label="+ Add skill" />
                </div>
              );
              case 'certifications': return data.certifications.length > 0 ? (
                <div key="certifications" style={{ marginBottom: 16 }}>
                  <LSH id="certifications" label="Certifications" />
                  {data.certifications.map(c => (
                    <div key={c.id} className="group" style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <EditableField value={c.name} onChange={v => store.updateCertification(c.id, 'name', v)} style={{ fontWeight: 600, color: '#1a202c', fontSize: fs - 0.5 + 'px' }} />
                        <Del onClick={() => store.removeCertification(c.id)} />
                      </div>
                      <EditableField value={c.issuer} onChange={v => store.updateCertification(c.id, 'issuer', v)} style={{ fontSize: fs - 1 + 'px', color: '#718096', display: 'block' }} />
                      <EditableField value={c.date} onChange={v => store.updateCertification(c.id, 'date', v)} style={{ fontSize: fs - 1.5 + 'px', color: '#a0aec0' }} />
                    </div>
                  ))}
                  <Add onClick={() => store.addCertification()} label="+ Add certification" />
                </div>
              ) : null;
              default: return null;
            }
          })}
        </div>
      </div>
    </div>
  );
};

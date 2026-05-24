/**
 * Deedy Resume — Student · Two-column (33 / 67) · Bold header · Lato + Raleway feel.
 * Left: Education, Skills, Contact. Right: Experience, Projects, Awards.
 */
import React from 'react';
import type { ResumeData } from '../../../../types/resume';
import { EditableField, EditableBullet } from '../EditableField';
import { useResumeStore } from '../../../../store/resumeStore';
import { Plus, Trash2 } from 'lucide-react';
import { CustomSectionBlock } from '../shared/CustomSectionBlock';
import { PhotoUpload } from '../shared/PhotoUpload';

interface Props { data: ResumeData; isPrinting: boolean }

export const DeedyTemplate: React.FC<Props> = ({ data, isPrinting }) => {
  const store = useResumeStore();
  const { settings, personalInfo, sections } = data;
  const visible = (id: string) => sections.some(s => s.id === id && s.visible !== false);
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
      <h3 style={{ fontSize: fs + 1 + 'px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff', background: acc, margin: '12px 0 6px', padding: '3px 8px', borderRadius: 2 }}>
        {!isPrinting && id
          ? <EditableField value={lbl} onChange={v => store.updateSection(id, { label: v })} style={{ display: 'inline', color: '#fff' }} />
          : <span dangerouslySetInnerHTML={{ __html: lbl }} />}
      </h3>
    );
  };
  const RSH = ({ id, label }: { id?: string; label: string }) => {
    const lbl = id ? (sections.find(s => s.id === id)?.label ?? label) : label;
    return (
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: fs + 4 + 'px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1a202c', margin: 0, borderBottom: `3px solid ${acc}`, paddingBottom: 3 }}>
          {!isPrinting && id
            ? <EditableField value={lbl} onChange={v => store.updateSection(id, { label: v })} style={{ display: 'inline' }} />
            : <span dangerouslySetInnerHTML={{ __html: lbl }} />}
        </h2>
      </div>
    );
  };

  const dateStr = (s: string, e: string) => [s, e].filter(Boolean).join(' – ');
  const visibleLinks = personalInfo.contactLinks.filter(l => l.visible && l.value.trim());

  const leftBg = '#f7f8fa';

  return (
    <div style={{ fontFamily: settings.fontFamily + ', Lato, sans-serif', fontSize: fs + 'px', lineHeight: settings.lineHeight, background: '#fff', color: '#2d3748', display: 'flex', flexDirection: 'column' }}>
      {/* ── Full-width header ── */}
      <div style={{ padding: `${settings.topMargin * 4 + 16}px 0 14px`, textAlign: 'center', borderBottom: `4px solid ${acc}` }}>
        <EditableField value={personalInfo.name} onChange={v => store.updatePersonalInfo('name', v)}
          style={{ fontSize: fs + 22 + 'px', fontWeight: 900, letterSpacing: '0.04em', color: '#1a202c', display: 'block', textTransform: 'uppercase' }} />
        <EditableField value={personalInfo.title} onChange={v => store.updatePersonalInfo('title', v)} placeholder="Position / Tagline"
          style={{ fontSize: fs + 2 + 'px', color: acc, fontWeight: 400, letterSpacing: '0.12em', display: 'block', marginTop: 2 }} />
      </div>

      {/* ── Two columns ── */}
      <div style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
        {/* Left (33%) */}
        <div style={{ width: '33%', background: leftBg, padding: '12px 16px 40px', borderRight: `1px solid #e2e8f0`, flexShrink: 0 }}>

          {/* Photo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, marginTop: 4 }}>
            <PhotoUpload size={68} isPrinting={isPrinting} />
          </div>

          {/* Contact */}
          <LSH label="Contact" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {visibleLinks.map(lk => (
              <EditableField key={lk.id} value={lk.value} onChange={v => store.updateContactLink(lk.id, { value: v })} style={{ fontSize: fs - 1 + 'px', color: '#4a5568', display: 'block', wordBreak: 'break-all' }} />
            ))}
          </div>

          {/* Education on left */}
          {visible('education') && (
            <>
              <LSH id="education" label="Education" />
              {data.education.map(edu => (
                <div key={edu.id} className="group" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <EditableField value={edu.institution} onChange={v => store.updateEducation(edu.id, 'institution', v)} style={{ fontWeight: 700, fontSize: fs - 0.5 + 'px', color: '#1a202c' }} />
                    <Del onClick={() => store.removeEducation(edu.id)} />
                  </div>
                  <EditableField value={edu.degree} onChange={v => store.updateEducation(edu.id, 'degree', v)} style={{ fontStyle: 'italic', fontSize: fs - 1 + 'px', color: '#4a5568', display: 'block' }} />
                  <div style={{ fontSize: fs - 1.5 + 'px', color: '#718096' }}>
                    <EditableField value={dateStr(edu.startDate, edu.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateEducation(edu.id, 'startDate', s?.trim() ?? ''); store.updateEducation(edu.id, 'endDate', r.join('').trim()); }} />
                    {edu.location && <><span> · </span><EditableField value={edu.location} onChange={v => store.updateEducation(edu.id, 'location', v)} /></>}
                  </div>
                  {edu.gpa && <div style={{ fontSize: fs - 1.5 + 'px', color: acc }}>GPA: <EditableField value={edu.gpa} onChange={v => store.updateEducation(edu.id, 'gpa', v)} /></div>}
                </div>
              ))}
              <Add onClick={() => store.addEducation()} label="+ Add education" />
            </>
          )}

          {/* Skills on left */}
          {visible('skills') && (
            <>
              <LSH id="skills" label="Skills" />
              {data.skills.map(sk => (
                <div key={sk.id} className="group" style={{ marginBottom: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <EditableField value={sk.category} onChange={v => store.updateSkillCategory(sk.id, 'category', v)} style={{ fontWeight: 700, fontSize: fs - 0.5 + 'px', color: acc }} />
                    <Del onClick={() => store.removeSkillCategory(sk.id)} />
                  </div>
                  <EditableField value={sk.skills} onChange={v => store.updateSkillCategory(sk.id, 'skills', v)} style={{ fontSize: fs - 1 + 'px', color: '#4a5568', display: 'block' }} />
                </div>
              ))}
              <Add onClick={() => store.addSkillCategory()} label="+ Add skill" />
            </>
          )}

          {/* Certifications on left */}
          {visible('certifications') && data.certifications.length > 0 && (
            <>
              <LSH id="certifications" label="Awards" />
              {data.certifications.map(c => (
                <div key={c.id} className="group" style={{ marginBottom: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <EditableField value={c.name} onChange={v => store.updateCertification(c.id, 'name', v)} style={{ fontWeight: 600, fontSize: fs - 0.5 + 'px', color: '#1a202c' }} />
                    <Del onClick={() => store.removeCertification(c.id)} />
                  </div>
                  {c.issuer && <EditableField value={c.issuer} onChange={v => store.updateCertification(c.id, 'issuer', v)} style={{ fontSize: fs - 1 + 'px', color: '#718096', display: 'block' }} />}
                  {c.date && <EditableField value={c.date} onChange={v => store.updateCertification(c.id, 'date', v)} style={{ fontSize: fs - 1.5 + 'px', color: acc }} />}
                </div>
              ))}
              <Add onClick={() => store.addCertification()} label="+ Add award" />
            </>
          )}
        </div>

        {/* Right (67%) */}
        <div style={{ flex: 1, padding: '12px 24px 40px 20px' }}>

          {/* Summary */}
          {visible('summary') && (
            <div style={{ marginBottom: 14 }}>
              <RSH id="summary" label="Profile" />
              <EditableField value={data.summary} onChange={v => store.updateSummary(v)} multiline style={{ color: '#4a5568', display: 'block', lineHeight: '1.6' }} />
            </div>
          )}

          {/* Experience */}
          {visible('experience') && (
            <div style={{ marginBottom: 14 }}>
              <RSH id="experience" label="Experience" />
              {data.experience.map(exp => (
                <div key={exp.id} className="group" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span>
                      <EditableField value={exp.company} onChange={v => store.updateExperience(exp.id, 'company', v)} style={{ fontWeight: 800, fontSize: fs + 1 + 'px', color: '#1a202c' }} />
                      <span style={{ fontWeight: 400, color: '#718096', margin: '0 6px', fontSize: fs + 'px' }}>|</span>
                      <EditableField value={exp.title} onChange={v => store.updateExperience(exp.id, 'title', v)} style={{ fontStyle: 'italic', color: acc, fontSize: fs + 'px' }} />
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ textAlign: 'right', fontSize: fs - 1 + 'px', color: '#718096' }}>
                        <EditableField value={dateStr(exp.startDate, exp.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateExperience(exp.id, 'startDate', s?.trim() ?? ''); store.updateExperience(exp.id, 'endDate', r.join('').trim()); }} />
                        {exp.location && <div><EditableField value={exp.location} onChange={v => store.updateExperience(exp.id, 'location', v)} /></div>}
                      </div>
                      <Del onClick={() => store.removeExperience(exp.id)} />
                    </div>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {exp.bullets.map((b, bi) => (
                      <EditableBullet key={bi} value={b} accentColor={acc} onChange={v => store.updateExperienceBullet(exp.id, bi, v)} onRemove={() => store.removeExperienceBullet(exp.id, bi)} isPrinting={isPrinting} onAddNext={() => store.addExperienceBullet(exp.id)} />
                    ))}
                    <Add onClick={() => store.addExperienceBullet(exp.id)} label="+ Add bullet" />
                  </div>
                </div>
              ))}
              <Add onClick={() => store.addExperience()} label="+ Add experience" />
            </div>
          )}

          {/* Projects */}
          {visible('projects') && (
            <div style={{ marginBottom: 14 }}>
              <RSH id="projects" label="Projects" />
              {data.projects.map(proj => (
                <div key={proj.id} className="group" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span>
                      <EditableField value={proj.name} onChange={v => store.updateProject(proj.id, 'name', v)} style={{ fontWeight: 700, color: '#1a202c', fontSize: fs + 1 + 'px' }} />
                      {proj.technologies && <><span style={{ color: '#718096', margin: '0 4px' }}>|</span><EditableField value={proj.technologies} onChange={v => store.updateProject(proj.id, 'technologies', v)} style={{ fontStyle: 'italic', color: '#718096' }} /></>}
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
          )}

          {/* Custom sections */}
          {data.customSections.filter(cs => visible(cs.id)).map(cs => (
            <div key={cs.id} style={{ marginBottom: 14 }}>
              <CustomSectionBlock section={cs} accentColor={acc} fontSize={fs} lineHeight={settings.lineHeight} sectionSpacing={settings.sectionSpacing} isPrinting={isPrinting} headerElement={<RSH label={cs.title} />} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

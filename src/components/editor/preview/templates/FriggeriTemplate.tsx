/**
 * Friggeri CV: Executive · Two-tone name header · Dark left sidebar · Timeline entries.
 */
import React from 'react';
import type { ResumeData } from '../../../../types/resume';
import { EditableField, EditableBullet } from '../EditableField';
import { useResumeStore } from '../../../../store/resumeStore';
import { Plus, Trash2 } from 'lucide-react';
import { CustomSectionBlock } from '../shared/CustomSectionBlock';
import { PhotoUpload } from '../shared/PhotoUpload';

interface Props { data: ResumeData; isPrinting: boolean }

export const FriggeriTemplate: React.FC<Props> = ({ data, isPrinting }) => {
  const store = useResumeStore.getState();
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

  const RSH = ({ id, label }: { id?: string; label: string }) => {
    const lbl = id ? (sections.find(s => s.id === id)?.label ?? label) : label;
    return (
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: fs + 3 + 'px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1a202c', margin: 0, borderBottom: `1px solid #e2e8f0`, paddingBottom: 5 }}>
          {!isPrinting && id
            ? <EditableField value={lbl} onChange={v => store.updateSection(id, { label: v })} style={{ display: 'inline' }} />
            : <span>{lbl}</span>}
        </h2>
      </div>
    );
  };

  const sidebarBg = settings.columnBgColor || '#2d2d2d';
  const dateStr = (s: string, e: string) => [s, e].filter(Boolean).join(' – ');
  const visibleLinks = personalInfo.contactLinks.filter(l => l.visible && l.value.trim());

  return (
    <div style={{ fontFamily: settings.fontFamily + ', Helvetica Neue, Arial, sans-serif', fontSize: fs + 'px', lineHeight: settings.lineHeight, background: '#fff', color: '#2d3748', display: 'flex', flexDirection: 'column' }}>
      {/* Header bar: photo top-left, name/title to the right */}
      <div style={{ background: '#2d2d2d', display: 'flex', alignItems: 'flex-end', padding: `${settings.topMargin * 4 + 20}px 0 16px` }}>
        <div style={{ width: '28%', flexShrink: 0, display: 'flex', justifyContent: 'center', paddingBottom: 4 }}>
          <PhotoUpload size={78} isPrinting={isPrinting} />
        </div>
        <div style={{ paddingRight: 40 }}>
          <EditableField value={personalInfo.name} onChange={v => store.updatePersonalInfo('name', v)}
            style={{ fontSize: fs + 22 + 'px', fontWeight: 300, color: '#fff', letterSpacing: '-0.01em', display: 'block' }} />
          <EditableField value={personalInfo.title} onChange={v => store.updatePersonalInfo('title', v)} placeholder="Position"
            style={{ fontSize: fs + 1 + 'px', color: '#a0aec0', fontWeight: 300, display: 'block', marginTop: 2 }} />
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* ── Left Sidebar ── */}
        <div style={{ width: '28%', background: sidebarBg, padding: '18px 16px 40px', flexShrink: 0, color: '#e2e8f0' }}>

          {/* Contact */}
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: fs - 0.5 + 'px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#718096', marginBottom: 8 }}>Contact</h3>
            {visibleLinks.map(lk => (
              <div key={lk.id} style={{ marginBottom: 4 }}>
                <EditableField value={lk.value} onChange={v => store.updateContactLink(lk.id, { value: v })} style={{ fontSize: fs - 1 + 'px', color: '#e2e8f0', display: 'block', wordBreak: 'break-all' }} />
              </div>
            ))}
          </div>

          {/* Skills on sidebar */}
          {visible('skills') && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: fs - 0.5 + 'px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#718096', marginBottom: 8 }}>Skills</h3>
              {data.skills.map(sk => (
                <div key={sk.id} className="group" style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <EditableField value={sk.category} onChange={v => store.updateSkillCategory(sk.id, 'category', v)} style={{ fontWeight: 600, fontSize: fs - 0.5 + 'px', color: acc }} />
                    <Del onClick={() => store.removeSkillCategory(sk.id)} />
                  </div>
                  <EditableField value={sk.skills} onChange={v => store.updateSkillCategory(sk.id, 'skills', v)} style={{ fontSize: fs - 1.5 + 'px', color: '#a0aec0', display: 'block' }} />
                </div>
              ))}
              <Add onClick={() => store.addSkillCategory()} label="+ Add skill" />
            </div>
          )}

          {/* Education on sidebar */}
          {visible('education') && (
            <div>
              <h3 style={{ fontSize: fs - 0.5 + 'px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#718096', marginBottom: 8 }}>Education</h3>
              {data.education.map(edu => (
                <div key={edu.id} className="group" style={{ marginBottom: 10, borderLeft: `2px solid ${acc}`, paddingLeft: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <EditableField value={edu.institution} onChange={v => store.updateEducation(edu.id, 'institution', v)} style={{ fontWeight: 700, fontSize: fs - 1 + 'px', color: '#fff' }} />
                    <Del onClick={() => store.removeEducation(edu.id)} />
                  </div>
                  <EditableField value={edu.degree} onChange={v => store.updateEducation(edu.id, 'degree', v)} style={{ fontSize: fs - 1.5 + 'px', color: '#a0aec0', display: 'block' }} />
                  <EditableField value={dateStr(edu.startDate, edu.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateEducation(edu.id, 'startDate', s?.trim() ?? ''); store.updateEducation(edu.id, 'endDate', r.join('').trim()); }} style={{ fontSize: fs - 2 + 'px', color: acc }} />
                </div>
              ))}
              <Add onClick={() => store.addEducation()} label="+ Add education" />
            </div>
          )}
        </div>

        {/* ── Right Main Content ── */}
        <div style={{ flex: 1, padding: '20px 32px 40px 24px' }}>

          {/* Right sections: ordered by data.sections, excluding sidebar-fixed items */}
          {sections.filter(s => !['education', 'skills'].includes(s.id)).map(sec => {
            if (sec.visible === false) return null;
            switch (sec.id) {
              case 'summary': return (
                <div key="summary" style={{ marginBottom: 18 }}>
                  <RSH id="summary" label="Profile" />
                  <EditableField value={data.summary} onChange={v => store.updateSummary(v)} multiline style={{ color: '#4a5568', display: 'block', lineHeight: '1.65' }} />
                </div>
              );
              case 'experience': return (
                <div key="experience" style={{ marginBottom: 18 }}>
                  <RSH id="experience" label="Experience" />
                  {data.experience.map(exp => (
                    <div key={exp.id} className="group" style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 80, flexShrink: 0, textAlign: 'right', paddingTop: 2 }}>
                        <EditableField value={dateStr(exp.startDate, exp.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateExperience(exp.id, 'startDate', s?.trim() ?? ''); store.updateExperience(exp.id, 'endDate', r.join('').trim()); }} style={{ fontSize: fs - 2 + 'px', color: '#a0aec0', fontStyle: 'italic' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: acc, marginTop: 4 }} />
                        <div style={{ width: 1, flex: 1, background: '#e2e8f0', marginTop: 4 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <EditableField value={exp.company} onChange={v => store.updateExperience(exp.id, 'company', v)} style={{ fontWeight: 700, fontSize: fs + 1 + 'px', color: '#1a202c' }} />
                          <span style={{ color: '#a0aec0', fontSize: fs - 1 + 'px' }}>·</span>
                          <EditableField value={exp.title} onChange={v => store.updateExperience(exp.id, 'title', v)} style={{ fontStyle: 'italic', color: acc }} />
                          <Del onClick={() => store.removeExperience(exp.id)} />
                        </div>
                        <EditableField value={exp.location} onChange={v => store.updateExperience(exp.id, 'location', v)} style={{ fontSize: fs - 1 + 'px', color: '#718096', display: 'block' }} />
                        <div style={{ marginTop: 5 }}>
                          {exp.bullets.map((b, bi) => (<EditableBullet key={bi} value={b} accentColor={acc} onChange={v => store.updateExperienceBullet(exp.id, bi, v)} onRemove={() => store.removeExperienceBullet(exp.id, bi)} isPrinting={isPrinting} onAddNext={() => store.addExperienceBullet(exp.id)} />))}
                          <Add onClick={() => store.addExperienceBullet(exp.id)} label="+ Add bullet" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Add onClick={() => store.addExperience()} label="+ Add experience" />
                </div>
              );
              case 'projects': return (
                <div key="projects" style={{ marginBottom: 18 }}>
                  <RSH id="projects" label="Projects" />
                  {data.projects.map(proj => (
                    <div key={proj.id} className="group" style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span>
                          <EditableField value={proj.name} onChange={v => store.updateProject(proj.id, 'name', v)} style={{ fontWeight: 700, color: '#1a202c' }} />
                          {proj.technologies && <><span style={{ color: '#a0aec0' }}> · </span><EditableField value={proj.technologies} onChange={v => store.updateProject(proj.id, 'technologies', v)} style={{ fontStyle: 'italic', color: '#718096' }} /></>}
                        </span>
                        <Del onClick={() => store.removeProject(proj.id)} />
                      </div>
                      <div style={{ marginTop: 4 }}>
                        {proj.bullets.map((b, bi) => (<EditableBullet key={bi} value={b} accentColor={acc} onChange={v => store.updateProjectBullet(proj.id, bi, v)} onRemove={() => store.removeProjectBullet(proj.id, bi)} isPrinting={isPrinting} onAddNext={() => store.addProjectBullet(proj.id)} />))}
                        <Add onClick={() => store.addProjectBullet(proj.id)} label="+ Add bullet" />
                      </div>
                    </div>
                  ))}
                  <Add onClick={() => store.addProject()} label="+ Add project" />
                </div>
              );
              case 'certifications': return data.certifications.length > 0 ? (
                <div key="certifications" style={{ marginBottom: 18 }}>
                  <RSH id="certifications" label="Awards" />
                  {data.certifications.map(c => (
                    <div key={c.id} className="group" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <EditableField value={c.name} onChange={v => store.updateCertification(c.id, 'name', v)} style={{ fontWeight: 600 }} />
                        <EditableField value={c.issuer} onChange={v => store.updateCertification(c.id, 'issuer', v)} style={{ color: '#718096' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <EditableField value={c.date} onChange={v => store.updateCertification(c.id, 'date', v)} style={{ fontSize: fs - 1 + 'px', color: '#a0aec0', flexShrink: 0 }} />
                        <Del onClick={() => store.removeCertification(c.id)} />
                      </div>
                    </div>
                  ))}
                  <Add onClick={() => store.addCertification()} label="+ Add award" />
                </div>
              ) : null;
              default: {
                const cs = data.customSections.find(c => c.id === sec.id);
                return cs ? (
                  <div key={cs.id} style={{ marginBottom: 18 }}>
                    <CustomSectionBlock section={cs} accentColor={acc} fontSize={fs} lineHeight={settings.lineHeight} sectionSpacing={settings.sectionSpacing} isPrinting={isPrinting} headerElement={<RSH label={cs.title} />} />
                  </div>
                ) : null;
              }
            }
          })}
        </div>
      </div>
    </div>
  );
};

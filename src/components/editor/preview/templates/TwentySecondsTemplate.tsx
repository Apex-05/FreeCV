/**
 * Twenty Seconds CV: Consulting · Dark sidebar (30%) with photo + skills · Clean right panel.
 */
import React from 'react';
import type { ResumeData } from '../../../../types/resume';
import { EditableField, EditableBullet } from '../EditableField';
import { useResumeStore } from '../../../../store/resumeStore';
import { Plus, Trash2 } from 'lucide-react';
import { PhotoUpload } from '../shared/PhotoUpload';
import { CustomSectionBlock } from '../shared/CustomSectionBlock';

interface Props { data: ResumeData; isPrinting: boolean }

export const TwentySecondsTemplate: React.FC<Props> = ({ data, isPrinting }) => {
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
        <h2 style={{ fontSize: fs + 2 + 'px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1a202c', margin: 0, borderBottom: `2px solid ${acc}`, paddingBottom: 4 }}>
          {!isPrinting && id
            ? <EditableField value={lbl} onChange={v => store.updateSection(id, { label: v })} style={{ display: 'inline' }} />
            : <span>{lbl}</span>}
        </h2>
      </div>
    );
  };

  const sidebarBg = settings.columnBgColor || '#2c3e50';
  const sidebarText = '#ecf0f1';
  const dateStr = (s: string, e: string) => [s, e].filter(Boolean).join(' – ');
  const visibleLinks = personalInfo.contactLinks.filter(l => l.visible && l.value.trim());

  // skill dot renderer: click dot to set level, click filled dot again to decrement
  const SkillBar = ({ skillId, level }: { skillId: string; level: number }) => (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          onClick={isPrinting ? undefined : () => store.updateSkillLevel(skillId, i + 1 === level ? Math.max(1, level - 1) : i + 1)}
          style={{ width: 8, height: 8, borderRadius: '50%', background: i < level ? acc : 'rgba(255,255,255,0.25)', flexShrink: 0, cursor: isPrinting ? 'default' : 'pointer' }}
        />
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily: settings.fontFamily + ', sans-serif', fontSize: fs + 'px', lineHeight: settings.lineHeight, display: 'flex', background: '#fff', color: '#2d3748', minHeight: '100%' }}>
      {/* ── Left Sidebar ── */}
      <div style={{ width: '30%', background: sidebarBg, padding: `${settings.topMargin * 4 + 16}px 16px 40px`, flexShrink: 0, color: sidebarText }}>
        {/* Photo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <PhotoUpload size={80} isPrinting={isPrinting} />
        </div>

        {/* Name & title */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <EditableField value={personalInfo.name} onChange={v => store.updatePersonalInfo('name', v)} style={{ fontSize: fs + 6 + 'px', fontWeight: 800, color: '#fff', display: 'block', lineHeight: 1.2 }} />
          <EditableField value={personalInfo.title} onChange={v => store.updatePersonalInfo('title', v)} placeholder="Job Title" style={{ fontSize: fs - 0.5 + 'px', color: acc, display: 'block', marginTop: 4, letterSpacing: '0.06em' }} />
        </div>

        {/* Contact */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: fs - 0.5 + 'px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.85)', marginBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 3 }}>Contact</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {visibleLinks.map(lk => (
              <EditableField key={lk.id} value={lk.value} onChange={v => store.updateContactLink(lk.id, { value: v })} style={{ fontSize: fs - 1.5 + 'px', color: sidebarText, display: 'block', wordBreak: 'break-all' }} />
            ))}
          </div>
        </div>

        {/* Skills */}
        {visible('skills') && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: fs - 0.5 + 'px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.85)', marginBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 3 }}>Skills</h3>
            {data.skills.map((sk, i) => (
              <div key={sk.id} className="group" style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <EditableField value={sk.category || sk.skills} onChange={v => store.updateSkillCategory(sk.id, sk.category ? 'category' : 'skills', v)} style={{ fontSize: fs - 1 + 'px', color: sidebarText, fontWeight: 600 }} />
                  <Del onClick={() => store.removeSkillCategory(sk.id)} />
                </div>
                <SkillBar skillId={sk.id} level={sk.level ?? Math.min(5, Math.max(1, 5 - (i % 3)))} />
              </div>
            ))}
            <Add onClick={() => store.addSkillCategory()} label="+ Add skill" />
          </div>
        )}

        {/* Education on sidebar */}
        {visible('education') && (
          <div>
            <h3 style={{ fontSize: fs - 0.5 + 'px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.85)', marginBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 3 }}>Education</h3>
            {data.education.map(edu => (
              <div key={edu.id} className="group" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <EditableField value={edu.institution} onChange={v => store.updateEducation(edu.id, 'institution', v)} style={{ fontWeight: 700, fontSize: fs - 1 + 'px', color: '#fff' }} />
                  <Del onClick={() => store.removeEducation(edu.id)} />
                </div>
                <EditableField value={edu.degree} onChange={v => store.updateEducation(edu.id, 'degree', v)} style={{ fontSize: fs - 1.5 + 'px', color: '#bdc3c7', display: 'block' }} />
                <EditableField value={dateStr(edu.startDate, edu.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateEducation(edu.id, 'startDate', s?.trim() ?? ''); store.updateEducation(edu.id, 'endDate', r.join('').trim()); }} style={{ fontSize: fs - 2 + 'px', color: acc }} />
              </div>
            ))}
            <Add onClick={() => store.addEducation()} label="+ Add education" />
          </div>
        )}
      </div>

      {/* ── Right Content ── */}
      <div style={{ flex: 1, padding: `${settings.topMargin * 4 + 16}px 28px 40px 24px` }}>

        {/* Right sections: ordered by data.sections, excluding sidebar-fixed items */}
        {sections.filter(s => !['education', 'skills'].includes(s.id)).map(sec => {
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
                  <div key={exp.id} className="group" style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <EditableField value={exp.company} onChange={v => store.updateExperience(exp.id, 'company', v)} style={{ fontWeight: 700, fontSize: fs + 1 + 'px', color: '#1a202c' }} />
                        <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                          <EditableField value={exp.title} onChange={v => store.updateExperience(exp.id, 'title', v)} style={{ fontStyle: 'italic', color: acc }} />
                          <span style={{ color: '#a0aec0', fontSize: fs - 1 + 'px' }}>·</span>
                          <EditableField value={exp.location} onChange={v => store.updateExperience(exp.id, 'location', v)} style={{ fontSize: fs - 1 + 'px', color: '#718096' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <EditableField value={dateStr(exp.startDate, exp.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateExperience(exp.id, 'startDate', s?.trim() ?? ''); store.updateExperience(exp.id, 'endDate', r.join('').trim()); }} style={{ fontSize: fs - 1 + 'px', color: '#718096', flexShrink: 0, fontStyle: 'italic' }} />
                        <Del onClick={() => store.removeExperience(exp.id)} />
                      </div>
                    </div>
                    <div style={{ marginTop: 5 }}>
                      {exp.bullets.map((b, bi) => (<EditableBullet key={bi} value={b} accentColor={acc} onChange={v => store.updateExperienceBullet(exp.id, bi, v)} onRemove={() => store.removeExperienceBullet(exp.id, bi)} isPrinting={isPrinting} onAddNext={() => store.addExperienceBullet(exp.id)} />))}
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
              <div key="certifications" style={{ marginBottom: 16 }}>
                <RSH id="certifications" label="Certifications" />
                {data.certifications.map(c => (
                  <div key={c.id} className="group" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div>
                      <EditableField value={c.name} onChange={v => store.updateCertification(c.id, 'name', v)} style={{ fontWeight: 600 }} />
                      {c.issuer && <span style={{ color: '#a0aec0' }}> · </span>}<EditableField value={c.issuer} onChange={v => store.updateCertification(c.id, 'issuer', v)} style={{ color: '#718096' }} />
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
                <div key={cs.id} style={{ marginBottom: 16 }}>
                  <CustomSectionBlock section={cs} accentColor={acc} fontSize={fs} lineHeight={settings.lineHeight} sectionSpacing={settings.sectionSpacing} isPrinting={isPrinting} headerElement={<RSH label={cs.title} />} />
                </div>
              ) : null;
            }
          }
        })}
      </div>
    </div>
  );
};

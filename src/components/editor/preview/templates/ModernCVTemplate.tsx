/**
 * ModernCV — General Professional · Blue top stripe · Left date-hints · Banking style.
 */
import React from 'react';
import type { ResumeData } from '../../../../types/resume';
import { EditableField, EditableBullet } from '../EditableField';
import { useResumeStore } from '../../../../store/resumeStore';
import { Plus, Trash2 } from 'lucide-react';
import { PhotoUpload } from '../shared/PhotoUpload';
import { CustomSectionBlock } from '../shared/CustomSectionBlock';

interface Props { data: ResumeData; isPrinting: boolean }

export const ModernCVTemplate: React.FC<Props> = ({ data, isPrinting }) => {
  const store = useResumeStore.getState();
  const { settings, personalInfo, sections } = data;
  const visible = (id: string) => sections.some(s => s.id === id && s.visible !== false);
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
      <button onClick={onClick} className="no-print opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '0 3px', marginLeft: 2, flexShrink: 0 }}>
        <Trash2 size={11} />
      </button>
    );

  const SH = ({ id, label }: { id?: string; label: string }) => {
    const lbl = id ? (sections.find(s => s.id === id)?.label ?? label) : label;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <h2 style={{ fontSize: fs + 2 + 'px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1a202c', margin: 0, flexShrink: 0 }}>
          {!isPrinting && id
            ? <EditableField value={lbl} onChange={v => store.updateSection(id, { label: v })} style={{ display: 'inline' }} />
            : <span dangerouslySetInnerHTML={{ __html: lbl }} />}
        </h2>
        <div style={{ flex: 1, height: 1.5, background: acc }} />
      </div>
    );
  };

  // Two-col entry: date hint (80px) + content
  const EntryRow = ({ hint, children }: { hint?: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 76, flexShrink: 0, textAlign: 'right', paddingTop: 2, fontSize: fs - 1.5 + 'px', color: '#a0aec0', fontStyle: 'italic', lineHeight: 1.4 }}>{hint}</div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );

  const dateStr = (s: string, e: string) => [s, e].filter(Boolean).join('–');
  const visibleLinks = personalInfo.contactLinks.filter(l => l.visible && l.value.trim());

  return (
    <div style={{ fontFamily: settings.fontFamily + ', sans-serif', fontSize: fs + 'px', lineHeight: settings.lineHeight, background: '#fff', color: '#2d3748' }}>
      {/* ── Header stripe ── */}
      <div style={{ background: acc, padding: `${settings.topMargin * 4 + 16}px 40px 16px`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <EditableField value={personalInfo.name} onChange={v => store.updatePersonalInfo('name', v)}
            style={{ fontSize: fs + 18 + 'px', fontWeight: 300, color: '#fff', display: 'block', letterSpacing: '0.02em' }} />
          <EditableField value={personalInfo.title} onChange={v => store.updatePersonalInfo('title', v)} placeholder="Position"
            style={{ fontSize: fs + 1 + 'px', color: 'rgba(255,255,255,0.75)', display: 'block', marginTop: 2, fontWeight: 300 }} />
        </div>
        <PhotoUpload size={68} isPrinting={isPrinting} />
      </div>
      {/* Contact bar */}
      <div style={{ background: acc + 'dd', padding: '6px 40px', display: 'flex', flexWrap: 'wrap', gap: '4px 20px' }}>
        {visibleLinks.map(lk => (
          <EditableField key={lk.id} value={lk.value} onChange={v => store.updateContactLink(lk.id, { value: v })} style={{ fontSize: fs - 1 + 'px', color: 'rgba(255,255,255,0.9)' }} />
        ))}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '16px 40px 48px' }}>
        {sections.map(sec => {
          if (sec.visible === false) return null;
          switch (sec.id) {
            case 'summary': return (
              <div key="summary" style={gap}>
                <SH id="summary" label="Profile" />
                <EntryRow><EditableField value={data.summary} onChange={v => store.updateSummary(v)} multiline style={{ color: '#4a5568', display: 'block' }} /></EntryRow>
              </div>
            );
            case 'experience': return (
              <div key="experience" style={gap}>
                <SH id="experience" label="Experience" />
                {data.experience.map(exp => (
                  <EntryRow key={exp.id} hint={<><div>{exp.startDate}</div><div>{exp.endDate || 'Present'}</div><div style={{ color: '#718096' }}>{exp.location}</div></>}>
                    <div className="group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span>
                          <EditableField value={exp.title} onChange={v => store.updateExperience(exp.id, 'title', v)} style={{ fontWeight: 700, color: '#1a202c' }} />
                          <span style={{ color: '#a0aec0', margin: '0 6px' }}>at</span>
                          <EditableField value={exp.company} onChange={v => store.updateExperience(exp.id, 'company', v)} style={{ fontWeight: 600, color: acc }} />
                        </span>
                        <Del onClick={() => store.removeExperience(exp.id)} />
                      </div>
                      <div style={{ marginTop: 4 }}>
                        {exp.bullets.map((b, bi) => (<EditableBullet key={bi} value={b} accentColor={acc} onChange={v => store.updateExperienceBullet(exp.id, bi, v)} onRemove={() => store.removeExperienceBullet(exp.id, bi)} isPrinting={isPrinting} onAddNext={() => store.addExperienceBullet(exp.id)} />))}
                        <Add onClick={() => store.addExperienceBullet(exp.id)} label="+ Add bullet" />
                      </div>
                    </div>
                  </EntryRow>
                ))}
                <EntryRow><Add onClick={() => store.addExperience()} label="+ Add experience" /></EntryRow>
              </div>
            );
            case 'education': return (
              <div key="education" style={gap}>
                <SH id="education" label="Education" />
                {data.education.map(edu => (
                  <EntryRow key={edu.id} hint={dateStr(edu.startDate, edu.endDate)}>
                    <div className="group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span>
                          <EditableField value={edu.institution} onChange={v => store.updateEducation(edu.id, 'institution', v)} style={{ fontWeight: 700, color: '#1a202c' }} />
                          {edu.location && <><span style={{ color: '#a0aec0', margin: '0 4px' }}>·</span><EditableField value={edu.location} onChange={v => store.updateEducation(edu.id, 'location', v)} style={{ color: '#718096' }} /></>}
                        </span>
                        <Del onClick={() => store.removeEducation(edu.id)} />
                      </div>
                      <EditableField value={edu.degree} onChange={v => store.updateEducation(edu.id, 'degree', v)} style={{ fontStyle: 'italic', color: '#4a5568', display: 'block' }} />
                      {edu.gpa && <EditableField value={`GPA: ${edu.gpa}`} onChange={v => store.updateEducation(edu.id, 'gpa', v.replace('GPA: ', ''))} style={{ fontSize: fs - 1 + 'px', color: acc, display: 'block' }} />}
                    </div>
                  </EntryRow>
                ))}
                <EntryRow><Add onClick={() => store.addEducation()} label="+ Add education" /></EntryRow>
              </div>
            );
            case 'projects': return (
              <div key="projects" style={gap}>
                <SH id="projects" label="Projects" />
                {data.projects.map(proj => (
                  <EntryRow key={proj.id}>
                    <div className="group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span>
                          <EditableField value={proj.name} onChange={v => store.updateProject(proj.id, 'name', v)} style={{ fontWeight: 700, color: '#1a202c' }} />
                          {proj.technologies && <><span style={{ color: '#a0aec0', margin: '0 4px' }}>–</span><EditableField value={proj.technologies} onChange={v => store.updateProject(proj.id, 'technologies', v)} style={{ fontStyle: 'italic', color: '#718096' }} /></>}
                        </span>
                        <Del onClick={() => store.removeProject(proj.id)} />
                      </div>
                      <div style={{ marginTop: 4 }}>
                        {proj.bullets.map((b, bi) => (<EditableBullet key={bi} value={b} accentColor={acc} onChange={v => store.updateProjectBullet(proj.id, bi, v)} onRemove={() => store.removeProjectBullet(proj.id, bi)} isPrinting={isPrinting} onAddNext={() => store.addProjectBullet(proj.id)} />))}
                        <Add onClick={() => store.addProjectBullet(proj.id)} label="+ Add bullet" />
                      </div>
                    </div>
                  </EntryRow>
                ))}
                <EntryRow><Add onClick={() => store.addProject()} label="+ Add project" /></EntryRow>
              </div>
            );
            case 'skills': return (
              <div key="skills" style={gap}>
                <SH id="skills" label="Skills" />
                {data.skills.map(sk => (
                  <EntryRow key={sk.id} hint={sk.category}>
                    <div className="group" style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <EditableField value={sk.skills} onChange={v => store.updateSkillCategory(sk.id, 'skills', v)} style={{ color: '#4a5568', flex: 1 }} />
                      <Del onClick={() => store.removeSkillCategory(sk.id)} />
                    </div>
                  </EntryRow>
                ))}
                <EntryRow><Add onClick={() => store.addSkillCategory()} label="+ Add skill" /></EntryRow>
              </div>
            );
            case 'certifications': return data.certifications.length > 0 ? (
              <div key="certifications" style={gap}>
                <SH id="certifications" label="Certifications" />
                {data.certifications.map(c => (
                  <EntryRow key={c.id} hint={c.date}>
                    <div className="group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span>
                        <EditableField value={c.name} onChange={v => store.updateCertification(c.id, 'name', v)} style={{ fontWeight: 600 }} />
                        {c.issuer && <><span style={{ color: '#a0aec0', margin: '0 4px' }}>·</span><EditableField value={c.issuer} onChange={v => store.updateCertification(c.id, 'issuer', v)} style={{ color: '#718096' }} /></>}
                      </span>
                      <Del onClick={() => store.removeCertification(c.id)} />
                    </div>
                  </EntryRow>
                ))}
                <EntryRow><Add onClick={() => store.addCertification()} label="+ Add certification" /></EntryRow>
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

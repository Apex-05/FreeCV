/**
 * Hipster CV — Creative · Colored left sidebar · Rounded skill tags · Photo.
 */
import React from 'react';
import type { ResumeData } from '../../../../types/resume';
import { EditableField, EditableBullet } from '../EditableField';
import { useResumeStore } from '../../../../store/resumeStore';
import { Plus, Trash2 } from 'lucide-react';
import { PhotoUpload } from '../shared/PhotoUpload';
import { CustomSectionBlock } from '../shared/CustomSectionBlock';

interface Props { data: ResumeData; isPrinting: boolean }

export const HipsterTemplate: React.FC<Props> = ({ data, isPrinting }) => {
  const store = useResumeStore();
  const { settings, personalInfo, sections } = data;
  const visible = (id: string) => sections.some(s => s.id === id && s.visible !== false);
  const acc = settings.accentColor;
  const fs = settings.fontSize;

  const Add = ({ onClick, label, light }: { onClick: () => void; label: string; light?: boolean }) =>
    isPrinting ? null : (
      <button onClick={onClick} className="no-print" style={{ background: 'none', border: 'none', cursor: 'pointer', color: light ? 'rgba(255,255,255,0.5)' : '#9ca3af', fontSize: 11, padding: '2px 0', display: 'flex', alignItems: 'center', gap: 3 }}>
        <Plus size={11} /> {label}
      </button>
    );
  const Del = ({ onClick, light }: { onClick: () => void; light?: boolean }) =>
    isPrinting ? null : (
      <button onClick={onClick} className="no-print opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'none', border: 'none', cursor: 'pointer', color: light ? 'rgba(255,150,150,0.8)' : '#f87171', padding: '0 3px', marginLeft: 2, flexShrink: 0 }}>
        <Trash2 size={11} />
      </button>
    );

  const RSH = ({ id, label }: { id?: string; label: string }) => {
    const lbl = id ? (sections.find(s => s.id === id)?.label ?? label) : label;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <h2 style={{ fontSize: fs + 2 + 'px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: acc, margin: 0 }}>
          {!isPrinting && id
            ? <EditableField value={lbl} onChange={v => store.updateSection(id, { label: v })} style={{ display: 'inline' }} />
            : <span dangerouslySetInnerHTML={{ __html: lbl }} />}
        </h2>
        <div style={{ flex: 1, height: 2, background: acc + '30', borderRadius: 1 }} />
      </div>
    );
  };

  const Tag = ({ text }: { text: string }) => (
    <span style={{ display: 'inline-block', background: acc + '20', color: acc, fontSize: fs - 2 + 'px', fontWeight: 600, padding: '2px 8px', borderRadius: 999, border: `1px solid ${acc}40`, marginRight: 4, marginBottom: 4 }}>{text}</span>
  );

  const dateStr = (s: string, e: string) => [s, e].filter(Boolean).join(' – ');
  const visibleLinks = personalInfo.contactLinks.filter(l => l.visible && l.value.trim());
  const sidebarBg = acc;

  return (
    <div style={{ fontFamily: settings.fontFamily + ', "Nunito", sans-serif', fontSize: fs + 'px', lineHeight: settings.lineHeight, display: 'flex', background: '#fff', color: '#2d3748' }}>
      {/* ── Left Sidebar ── */}
      <div style={{ width: '31%', background: sidebarBg, padding: `${settings.topMargin * 4 + 20}px 16px 40px`, flexShrink: 0, color: '#fff', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Photo */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <PhotoUpload size={76} isPrinting={isPrinting} />
        </div>

        {/* Name + title */}
        <div style={{ textAlign: 'center' }}>
          <EditableField value={personalInfo.name} onChange={v => store.updatePersonalInfo('name', v)} style={{ fontSize: fs + 8 + 'px', fontWeight: 800, color: '#fff', display: 'block', lineHeight: 1.2 }} />
          <EditableField value={personalInfo.title} onChange={v => store.updatePersonalInfo('title', v)} placeholder="Your Role" style={{ fontSize: fs - 0.5 + 'px', color: 'rgba(255,255,255,0.75)', display: 'block', marginTop: 4, letterSpacing: '0.06em' }} />
        </div>

        {/* Contact */}
        <div>
          <h3 style={{ fontSize: fs - 1 + 'px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Contact</h3>
          {visibleLinks.map(lk => (
            <EditableField key={lk.id} value={lk.value} onChange={v => store.updateContactLink(lk.id, { value: v })} style={{ fontSize: fs - 1.5 + 'px', color: 'rgba(255,255,255,0.9)', display: 'block', marginBottom: 3, wordBreak: 'break-all' }} />
          ))}
        </div>

        {/* Skills — tag cloud */}
        {visible('skills') && (
          <div>
            <h3 style={{ fontSize: fs - 1 + 'px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Skills</h3>
            {data.skills.map(sk => (
              <div key={sk.id} className="group" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                  <span style={{ fontSize: fs - 1 + 'px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                    <EditableField value={sk.category || 'Skills'} onChange={v => store.updateSkillCategory(sk.id, 'category', v)} style={{ color: 'rgba(255,255,255,0.85)' }} />
                  </span>
                  <Del onClick={() => store.removeSkillCategory(sk.id)} light />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {sk.skills.split(/[,;]/).map((s, i) => s.trim() && (
                    <span key={i} style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: fs - 2 + 'px', padding: '2px 8px', borderRadius: 999, marginRight: 4, marginBottom: 4 }}>{s.trim()}</span>
                  ))}
                </div>
              </div>
            ))}
            <Add onClick={() => store.addSkillCategory()} label="+ Add skill" light />
          </div>
        )}

        {/* Education on sidebar */}
        {visible('education') && (
          <div>
            <h3 style={{ fontSize: fs - 1 + 'px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Education</h3>
            {data.education.map(edu => (
              <div key={edu.id} className="group" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <EditableField value={edu.institution} onChange={v => store.updateEducation(edu.id, 'institution', v)} style={{ fontWeight: 700, fontSize: fs - 1 + 'px', color: '#fff' }} />
                  <Del onClick={() => store.removeEducation(edu.id)} light />
                </div>
                <EditableField value={edu.degree} onChange={v => store.updateEducation(edu.id, 'degree', v)} style={{ fontSize: fs - 1.5 + 'px', color: 'rgba(255,255,255,0.7)', display: 'block' }} />
                <EditableField value={dateStr(edu.startDate, edu.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateEducation(edu.id, 'startDate', s?.trim() ?? ''); store.updateEducation(edu.id, 'endDate', r.join('').trim()); }} style={{ fontSize: fs - 2 + 'px', color: 'rgba(255,255,255,0.55)' }} />
              </div>
            ))}
            <Add onClick={() => store.addEducation()} label="+ Add education" light />
          </div>
        )}
      </div>

      {/* ── Right Main ── */}
      <div style={{ flex: 1, padding: `${settings.topMargin * 4 + 20}px 28px 40px 22px` }}>

        {/* Summary */}
        {visible('summary') && (
          <div style={{ marginBottom: 18 }}>
            <RSH id="summary" label="About Me" />
            <EditableField value={data.summary} onChange={v => store.updateSummary(v)} multiline style={{ color: '#4a5568', display: 'block', lineHeight: '1.65' }} />
          </div>
        )}

        {/* Experience */}
        {visible('experience') && (
          <div style={{ marginBottom: 18 }}>
            <RSH id="experience" label="Experience" />
            {data.experience.map(exp => (
              <div key={exp.id} className="group" style={{ marginBottom: 14, paddingLeft: 12, borderLeft: `3px solid ${acc}30` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <EditableField value={exp.title} onChange={v => store.updateExperience(exp.id, 'title', v)} style={{ fontWeight: 800, fontSize: fs + 1 + 'px', color: '#1a202c' }} />
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <EditableField value={exp.company} onChange={v => store.updateExperience(exp.id, 'company', v)} style={{ fontWeight: 600, color: acc }} />
                      {exp.location && <><span style={{ color: '#a0aec0' }}>·</span><EditableField value={exp.location} onChange={v => store.updateExperience(exp.id, 'location', v)} style={{ fontSize: fs - 1 + 'px', color: '#718096' }} /></>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ background: acc + '15', color: acc, fontSize: fs - 1.5 + 'px', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                      <EditableField value={dateStr(exp.startDate, exp.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateExperience(exp.id, 'startDate', s?.trim() ?? ''); store.updateExperience(exp.id, 'endDate', r.join('').trim()); }} />
                    </span>
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
        )}

        {/* Projects */}
        {visible('projects') && (
          <div style={{ marginBottom: 18 }}>
            <RSH id="projects" label="Projects" />
            {data.projects.map(proj => (
              <div key={proj.id} className="group" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span>
                    <EditableField value={proj.name} onChange={v => store.updateProject(proj.id, 'name', v)} style={{ fontWeight: 700, color: '#1a202c' }} />
                    {proj.technologies && (
                      <div style={{ marginTop: 3 }}>
                        {proj.technologies.split(/[,;]/).map((t, i) => t.trim() && <Tag key={i} text={t.trim()} />)}
                      </div>
                    )}
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

        {/* Certifications */}
        {visible('certifications') && data.certifications.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <RSH id="certifications" label="Certifications" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {data.certifications.map(c => (
                <div key={c.id} className="group" style={{ background: acc + '10', border: `1px solid ${acc}30`, borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <EditableField value={c.name} onChange={v => store.updateCertification(c.id, 'name', v)} style={{ fontWeight: 600, fontSize: fs - 0.5 + 'px' }} />
                  {c.date && <span style={{ color: '#a0aec0', fontSize: fs - 2 + 'px' }}>{c.date}</span>}
                  <Del onClick={() => store.removeCertification(c.id)} />
                </div>
              ))}
            </div>
            <Add onClick={() => store.addCertification()} label="+ Add certification" />
          </div>
        )}

        {/* Custom sections */}
        {data.customSections.filter(cs => visible(cs.id)).map(cs => (
          <div key={cs.id} style={{ marginBottom: 18 }}>
            <CustomSectionBlock section={cs} accentColor={acc} fontSize={fs} lineHeight={settings.lineHeight} sectionSpacing={settings.sectionSpacing} isPrinting={isPrinting} headerElement={<RSH label={cs.title} />} />
          </div>
        ))}
      </div>
    </div>
  );
};

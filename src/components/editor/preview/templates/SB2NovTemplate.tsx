/**
 * SB2Nov: Finance · Left-aligned name, right-side contact · bold section borders · serif feel.
 */
import React from 'react';
import type { ResumeData } from '../../../../types/resume';
import { EditableField, EditableBullet } from '../EditableField';
import { useResumeStore } from '../../../../store/resumeStore';
import { Plus, Trash2 } from 'lucide-react';
import { CustomSectionBlock } from '../shared/CustomSectionBlock';
import { PhotoUpload } from '../shared/PhotoUpload';

interface Props { data: ResumeData; isPrinting: boolean }

export const SB2NovTemplate: React.FC<Props> = ({ data, isPrinting }) => {
  const store = useResumeStore.getState();
  const { settings, personalInfo, sections } = data;
  const acc = settings.accentColor;
  const fs = settings.fontSize;
  const gap: React.CSSProperties = { marginTop: settings.sectionSpacing * 3 + 8 + 'px' };

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
      <div style={{ marginBottom: 6 }}>
        <h2 style={{ fontSize: fs + 1 + 'px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1a202c', margin: 0, borderBottom: `2px solid ${acc}`, paddingBottom: 4 }}>
          {!isPrinting && id
            ? <EditableField value={lbl} onChange={v => store.updateSection(id, { label: v })} style={{ display: 'inline' }} />
            : <span>{lbl}</span>}
        </h2>
      </div>
    );
  };

  const dateStr = (s: string, e: string) => [s, e].filter(Boolean).join(' – ');
  const visibleLinks = personalInfo.contactLinks.filter(l => l.visible && l.value.trim());

  return (
    <div style={{ fontFamily: settings.fontFamily + ', Georgia, serif', fontSize: fs + 'px', lineHeight: settings.lineHeight, padding: `${settings.topMargin * 4 + 8}px 44px 44px`, color: '#1a202c', background: '#fff' }}>
      {/* ── Header: name left, contact right ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10, borderBottom: `3px double ${acc}`, paddingBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <PhotoUpload size={64} isPrinting={isPrinting} />
          <div>
            <EditableField value={personalInfo.name} onChange={v => store.updatePersonalInfo('name', v)}
              style={{ fontSize: fs + 16 + 'px', fontWeight: 900, color: '#111', display: 'block', letterSpacing: '-0.01em' }} />
            <EditableField value={personalInfo.title} onChange={v => store.updatePersonalInfo('title', v)} placeholder="Professional Title"
              style={{ fontSize: fs + 1 + 'px', color: acc, fontWeight: 500, display: 'block', marginTop: 2 }} />
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {visibleLinks.map(lk => (
            <EditableField key={lk.id} value={lk.value} onChange={v => store.updateContactLink(lk.id, { value: v })} style={{ fontSize: fs - 1 + 'px', color: '#4a5568', display: 'block' }} />
          ))}
        </div>
      </div>

      {/* ── Sections (ordered by data.sections) ── */}
      {sections.map(sec => {
        if (sec.visible === false) return null;
        switch (sec.id) {
          case 'summary': return (
            <div key="summary" style={gap}>
              <SH id="summary" label="Professional Summary" />
              <EditableField value={data.summary} onChange={v => store.updateSummary(v)} multiline style={{ color: '#374151', display: 'block', lineHeight: '1.65', fontStyle: 'italic' }} />
            </div>
          );
          case 'experience': return (
            <div key="experience" style={gap}>
              <SH id="experience" label="Professional Experience" />
              {data.experience.map(exp => (
                <div key={exp.id} className="group" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <EditableField value={exp.company} onChange={v => store.updateExperience(exp.id, 'company', v)} style={{ fontWeight: 800, fontSize: fs + 1 + 'px', color: '#111' }} />
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <EditableField value={exp.location} onChange={v => store.updateExperience(exp.id, 'location', v)} style={{ fontSize: fs - 1 + 'px', color: '#718096', flexShrink: 0 }} />
                      <Del onClick={() => store.removeExperience(exp.id)} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <EditableField value={exp.title} onChange={v => store.updateExperience(exp.id, 'title', v)} style={{ fontStyle: 'italic', color: acc, fontWeight: 600 }} />
                    <EditableField value={dateStr(exp.startDate, exp.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateExperience(exp.id, 'startDate', s?.trim() ?? ''); store.updateExperience(exp.id, 'endDate', r.join('').trim()); }} style={{ fontSize: fs - 1 + 'px', color: '#718096', flexShrink: 0, fontStyle: 'italic' }} />
                  </div>
                  <div style={{ paddingLeft: 16, marginTop: 4 }}>
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
                <div key={edu.id} className="group" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <EditableField value={edu.institution} onChange={v => store.updateEducation(edu.id, 'institution', v)} style={{ fontWeight: 800, fontSize: fs + 1 + 'px', color: '#111' }} />
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <EditableField value={edu.location} onChange={v => store.updateEducation(edu.id, 'location', v)} style={{ fontSize: fs - 1 + 'px', color: '#718096', flexShrink: 0 }} />
                      <Del onClick={() => store.removeEducation(edu.id)} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <EditableField value={edu.degree} onChange={v => store.updateEducation(edu.id, 'degree', v)} style={{ fontStyle: 'italic', color: '#4a5568' }} />
                    <EditableField value={dateStr(edu.startDate, edu.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateEducation(edu.id, 'startDate', s?.trim() ?? ''); store.updateEducation(edu.id, 'endDate', r.join('').trim()); }} style={{ fontSize: fs - 1 + 'px', color: '#718096', flexShrink: 0, fontStyle: 'italic' }} />
                  </div>
                  {edu.gpa && <EditableField value={`GPA: ${edu.gpa}`} onChange={v => store.updateEducation(edu.id, 'gpa', v.replace('GPA: ', ''))} style={{ fontSize: fs - 1 + 'px', color: acc }} />}
                </div>
              ))}
              <Add onClick={() => store.addEducation()} label="+ Add education" />
            </div>
          );
          case 'projects': return (
            <div key="projects" style={gap}>
              <SH id="projects" label="Selected Projects" />
              {data.projects.map(proj => (
                <div key={proj.id} className="group" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span>
                      <EditableField value={proj.name} onChange={v => store.updateProject(proj.id, 'name', v)} style={{ fontWeight: 700, color: '#111' }} />
                      {proj.technologies && <><span style={{ color: '#718096' }}> · </span><EditableField value={proj.technologies} onChange={v => store.updateProject(proj.id, 'technologies', v)} style={{ fontStyle: 'italic', color: '#718096' }} /></>}
                    </span>
                    <Del onClick={() => store.removeProject(proj.id)} />
                  </div>
                  <div style={{ paddingLeft: 16, marginTop: 3 }}>
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
              <SH id="skills" label="Core Competencies" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 20px' }}>
                {data.skills.map(sk => (
                  <div key={sk.id} className="group" style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ color: acc, fontWeight: 700, flexShrink: 0 }}>▸</span>
                    <EditableField value={sk.category ? `${sk.category}: ${sk.skills}` : sk.skills} onChange={v => store.updateSkillCategory(sk.id, 'skills', v)} style={{ fontSize: fs - 0.5 + 'px', color: '#374151', flex: 1 }} />
                    <Del onClick={() => store.removeSkillCategory(sk.id)} />
                  </div>
                ))}
              </div>
              <Add onClick={() => store.addSkillCategory()} label="+ Add skill" />
            </div>
          );
          case 'certifications': return data.certifications.length > 0 ? (
            <div key="certifications" style={gap}>
              <SH id="certifications" label="Certifications & Awards" />
              {data.certifications.map(c => (
                <div key={c.id} className="group" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <EditableField value={c.name} onChange={v => store.updateCertification(c.id, 'name', v)} style={{ fontWeight: 600 }} />
                    <EditableField value={c.issuer} onChange={v => store.updateCertification(c.id, 'issuer', v)} style={{ color: '#718096', fontStyle: 'italic' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <EditableField value={c.date} onChange={v => store.updateCertification(c.id, 'date', v)} style={{ fontSize: fs - 1 + 'px', color: '#718096', flexShrink: 0 }} />
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
  );
};

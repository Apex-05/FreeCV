/**
 * Academic CV — Serif, comprehensive, left date-hint column, publications-ready.
 */
import React from 'react';
import type { ResumeData } from '../../../../types/resume';
import { EditableField, EditableBullet } from '../EditableField';
import { useResumeStore } from '../../../../store/resumeStore';
import { Plus, Trash2 } from 'lucide-react';
import { CustomSectionBlock } from '../shared/CustomSectionBlock';
import { PhotoUpload } from '../shared/PhotoUpload';

interface Props { data: ResumeData; isPrinting: boolean }

export const AcademicCVTemplate: React.FC<Props> = ({ data, isPrinting }) => {
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
      <button onClick={onClick} className="no-print opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '0 3px', marginLeft: 2, flexShrink: 0 }}>
        <Trash2 size={11} />
      </button>
    );

  const SH = ({ id, label }: { id?: string; label: string }) => {
    const lbl = id ? (sections.find(s => s.id === id)?.label ?? label) : label;
    return (
      <h2 style={{ fontSize: fs + 2 + 'px', fontWeight: 700, letterSpacing: '0.04em', color: '#1a202c', margin: '0 0 8px', textTransform: 'uppercase', borderBottom: `1.5px solid ${acc}55`, paddingBottom: 4 }}>
        {!isPrinting && id
          ? <EditableField value={lbl} onChange={v => store.updateSection(id, { label: v })} style={{ display: 'inline' }} />
          : <span>{lbl}</span>}
      </h2>
    );
  };

  // Two-column entry row: date hint on left (70px), content on right
  const Row = ({ date, children }: { date?: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 70, flexShrink: 0, textAlign: 'right', paddingTop: 1, fontSize: fs - 2 + 'px', color: '#718096', fontStyle: 'italic' }}>
        {date}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );

  const dateStr = (s: string, e: string) => [s, e].filter(Boolean).join('–');
  const visibleLinks = personalInfo.contactLinks.filter(l => l.visible && l.value.trim());

  return (
    <div style={{ fontFamily: settings.fontFamily + ', "Palatino Linotype", Georgia, serif', fontSize: fs + 'px', lineHeight: settings.lineHeight, padding: `${settings.topMargin * 4 + 10}px 44px 48px`, color: '#1a1a1a', background: '#fff' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: `2px solid ${acc}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <PhotoUpload size={68} isPrinting={isPrinting} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <EditableField value={personalInfo.name} onChange={v => store.updatePersonalInfo('name', v)}
              style={{ fontSize: fs + 16 + 'px', fontWeight: 700, display: 'block', letterSpacing: '0.04em', color: '#111', marginBottom: 3 }} />
            <EditableField value={personalInfo.title} onChange={v => store.updatePersonalInfo('title', v)} placeholder="Research Position / Department"
              style={{ fontSize: fs + 1 + 'px', color: acc, display: 'block', marginBottom: 8 }} />
            {/* Contact in a gray band */}
            <div style={{ background: '#f7f8fa', border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 16px', display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 16px' }}>
              {visibleLinks.map(lk => (
                <EditableField key={lk.id} value={lk.value} onChange={v => store.updateContactLink(lk.id, { value: v })} style={{ fontSize: fs - 1 + 'px', color: '#4a5568' }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sections (ordered by data.sections) ── */}
      {sections.map(sec => {
        if (sec.visible === false) return null;
        switch (sec.id) {
          case 'summary': return (
            <div key="summary" style={gap}>
              <SH id="summary" label="Research Interests" />
              <Row><EditableField value={data.summary} onChange={v => store.updateSummary(v)} multiline style={{ color: '#374151', display: 'block', lineHeight: '1.7' }} /></Row>
            </div>
          );
          case 'education': return (
            <div key="education" style={gap}>
              <SH id="education" label="Education" />
              {data.education.map(edu => (
                <Row key={edu.id} date={<EditableField value={dateStr(edu.startDate, edu.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateEducation(edu.id, 'startDate', s?.trim() ?? ''); store.updateEducation(edu.id, 'endDate', r.join('').trim()); }} />}>
                  <div className="group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <EditableField value={edu.institution} onChange={v => store.updateEducation(edu.id, 'institution', v)} style={{ fontWeight: 700, color: '#111' }} />
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <EditableField value={edu.location} onChange={v => store.updateEducation(edu.id, 'location', v)} style={{ fontSize: fs - 1 + 'px', color: '#718096', flexShrink: 0 }} />
                        <Del onClick={() => store.removeEducation(edu.id)} />
                      </div>
                    </div>
                    <EditableField value={edu.degree} onChange={v => store.updateEducation(edu.id, 'degree', v)} style={{ fontStyle: 'italic', color: '#4a5568', display: 'block' }} />
                    {edu.gpa && <EditableField value={`GPA: ${edu.gpa}`} onChange={v => store.updateEducation(edu.id, 'gpa', v.replace('GPA: ', ''))} style={{ fontSize: fs - 1 + 'px', color: '#718096', display: 'block' }} />}
                    {edu.bullets.map((b, bi) => (<EditableBullet key={bi} value={b} accentColor={acc} onChange={v => store.updateEducationBullet(edu.id, bi, v)} onRemove={() => store.removeEducationBullet(edu.id, bi)} isPrinting={isPrinting} />))}
                  </div>
                </Row>
              ))}
              <Row><Add onClick={() => store.addEducation()} label="+ Add education" /></Row>
            </div>
          );
          case 'experience': return (
            <div key="experience" style={gap}>
              <SH id="experience" label="Academic Positions" />
              {data.experience.map(exp => (
                <Row key={exp.id} date={<EditableField value={dateStr(exp.startDate, exp.endDate)} onChange={v => { const [s, ...r] = v.split(/\s*[–-]\s*/); store.updateExperience(exp.id, 'startDate', s?.trim() ?? ''); store.updateExperience(exp.id, 'endDate', r.join('').trim()); }} />}>
                  <div className="group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div>
                        <EditableField value={exp.title} onChange={v => store.updateExperience(exp.id, 'title', v)} style={{ fontWeight: 700, color: '#111' }} />
                        <div><EditableField value={exp.company} onChange={v => store.updateExperience(exp.id, 'company', v)} style={{ fontStyle: 'italic', color: acc }} /></div>
                        <div style={{ fontSize: fs - 1 + 'px', color: '#718096' }}><EditableField value={exp.location} onChange={v => store.updateExperience(exp.id, 'location', v)} /></div>
                      </div>
                      <Del onClick={() => store.removeExperience(exp.id)} />
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {exp.bullets.map((b, bi) => (<EditableBullet key={bi} value={b} accentColor={acc} onChange={v => store.updateExperienceBullet(exp.id, bi, v)} onRemove={() => store.removeExperienceBullet(exp.id, bi)} isPrinting={isPrinting} onAddNext={() => store.addExperienceBullet(exp.id)} />))}
                      <Add onClick={() => store.addExperienceBullet(exp.id)} label="+ Add bullet" />
                    </div>
                  </div>
                </Row>
              ))}
              <Row><Add onClick={() => store.addExperience()} label="+ Add position" /></Row>
            </div>
          );
          case 'projects': return (
            <div key="projects" style={gap}>
              <SH id="projects" label="Research & Publications" />
              {data.projects.map(proj => (
                <Row key={proj.id}>
                  <div className="group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span>
                        <EditableField value={proj.name} onChange={v => store.updateProject(proj.id, 'name', v)} style={{ fontWeight: 700, color: '#111' }} />
                        {proj.technologies && <><span style={{ color: '#718096' }}>, </span><EditableField value={proj.technologies} onChange={v => store.updateProject(proj.id, 'technologies', v)} style={{ fontStyle: 'italic', color: '#4a5568' }} /></>}
                      </span>
                      <Del onClick={() => store.removeProject(proj.id)} />
                    </div>
                    <div style={{ marginTop: 3 }}>
                      {proj.bullets.map((b, bi) => (<EditableBullet key={bi} value={b} accentColor={acc} onChange={v => store.updateProjectBullet(proj.id, bi, v)} onRemove={() => store.removeProjectBullet(proj.id, bi)} isPrinting={isPrinting} onAddNext={() => store.addProjectBullet(proj.id)} />))}
                      <Add onClick={() => store.addProjectBullet(proj.id)} label="+ Add detail" />
                    </div>
                  </div>
                </Row>
              ))}
              <Row><Add onClick={() => store.addProject()} label="+ Add publication" /></Row>
            </div>
          );
          case 'skills': return (
            <div key="skills" style={gap}>
              <SH id="skills" label="Skills & Techniques" />
              {data.skills.map(sk => (
                <Row key={sk.id}>
                  <div className="group" style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <EditableField value={sk.category} onChange={v => store.updateSkillCategory(sk.id, 'category', v)} style={{ fontWeight: 700, minWidth: 90 }} />
                    <span>:</span>
                    <EditableField value={sk.skills} onChange={v => store.updateSkillCategory(sk.id, 'skills', v)} style={{ color: '#4a5568', flex: 1 }} />
                    <Del onClick={() => store.removeSkillCategory(sk.id)} />
                  </div>
                </Row>
              ))}
              <Row><Add onClick={() => store.addSkillCategory()} label="+ Add skill" /></Row>
            </div>
          );
          case 'certifications': return data.certifications.length > 0 ? (
            <div key="certifications" style={gap}>
              <SH id="certifications" label="Grants & Awards" />
              {data.certifications.map(c => (
                <Row key={c.id} date={<EditableField value={c.date} onChange={v => store.updateCertification(c.id, 'date', v)} />}>
                  <div className="group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      <EditableField value={c.name} onChange={v => store.updateCertification(c.id, 'name', v)} style={{ fontWeight: 600, color: '#111' }} />
                      {c.issuer && <span style={{ color: '#a0aec0' }}> – </span>}<EditableField value={c.issuer} onChange={v => store.updateCertification(c.id, 'issuer', v)} style={{ fontStyle: 'italic', color: '#4a5568' }} />
                    </div>
                    <Del onClick={() => store.removeCertification(c.id)} />
                  </div>
                </Row>
              ))}
              <Row><Add onClick={() => store.addCertification()} label="+ Add award" /></Row>
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

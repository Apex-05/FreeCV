import { create } from 'zustand';
import type {
  ResumeData, ResumeSettings, PersonalInfo, EducationEntry, ExperienceEntry,
  ProjectEntry, SkillCategory, CertificationEntry, SectionConfig, TemplateId,
  ContactLink, ContactLinkType, CustomSection, CustomSectionEntry,
} from '../types/resume';
import { defaultResume } from '../data/defaultResume';
import { nanoid } from '../utils/nanoid';

const STORAGE_KEY = 'freecv_resume_v2';
const MAX_HISTORY = 50;

const DEFAULT_SECTION_CONFIGS: Record<string, SectionConfig> = {
  summary: { id: 'summary', type: 'summary', label: 'Summary', visible: true },
  education: { id: 'education', type: 'education', label: 'Education', visible: true },
  experience: { id: 'experience', type: 'experience', label: 'Experience', visible: true },
  projects: { id: 'projects', type: 'projects', label: 'Projects', visible: true },
  skills: { id: 'skills', type: 'skills', label: 'Skills', visible: true },
  certifications: { id: 'certifications', type: 'certifications', label: 'Certifications', visible: true },
};

function migrate(raw: Record<string, unknown>): ResumeData {
  const pi = raw.personalInfo as Record<string, unknown>;
  if (pi && !pi.contactLinks) {
    const links: ContactLink[] = [];
    const add = (type: ContactLinkType, value: unknown) => {
      if (value && typeof value === 'string' && value.trim())
        links.push({ id: nanoid(), type, value: value.trim(), visible: true });
    };
    add('email', pi.email);
    add('phone', pi.phone);
    add('location', pi.location);
    add('linkedin', pi.linkedin);
    add('github', pi.github);
    add('twitter', (pi as Record<string, unknown>).twitter);
    add('instagram', (pi as Record<string, unknown>).instagram);
    add('website', pi.website);
    raw.personalInfo = { name: pi.name || '', title: pi.title || '', photo: pi.photo || null, contactLinks: links };
  }
  if (!raw.customSections) raw.customSections = [];
  const LEGACY_TEMPLATE_MAP: Record<string, TemplateId> = {
    modern: 'moderncv', classic: 'jake', minimal: 'jake',
    executive: 'friggeri', creative: 'hipster', academic: 'academiccv',
  };
  if (raw.settings && typeof raw.settings === 'object') {
    const s = raw.settings as Record<string, unknown>;
    if (!s.photoShape) s.photoShape = 'circle';
    if (!s.photoPosition) s.photoPosition = 'center top';
    if (s.bulletStyle === undefined) s.bulletStyle = '•';
    if (s.sideMargin === undefined) s.sideMargin = 0;
    if (s.columnBgColor === undefined) s.columnBgColor = '';
    if (s.photoSize === undefined) s.photoSize = 100;
    if (typeof s.template === 'string' && s.template in LEGACY_TEMPLATE_MAP)
      s.template = LEGACY_TEMPLATE_MAP[s.template];
  }
  if (raw.personalInfo && typeof raw.personalInfo === 'object') {
    const p = raw.personalInfo as Record<string, unknown>;
    if (p.showPhoto === undefined) p.showPhoto = true;
  }
  if (Array.isArray(raw.education)) {
    raw.education = (raw.education as Record<string, unknown>[]).map(e => ({ link: '', bullets: [], ...e }));
  } else if (!raw.education) { raw.education = []; }
  if (Array.isArray(raw.experience)) {
    raw.experience = (raw.experience as Record<string, unknown>[]).map(e => ({ link: '', bullets: [], ...e }));
  } else if (!raw.experience) { raw.experience = []; }
  if (Array.isArray(raw.projects)) {
    raw.projects = (raw.projects as Record<string, unknown>[]).map(p => ({ link: '', bullets: [], ...p }));
  } else if (!raw.projects) { raw.projects = []; }
  if (!Array.isArray(raw.skills)) raw.skills = [];
  if (!Array.isArray(raw.certifications)) raw.certifications = [];
  if (typeof raw.summary !== 'string') raw.summary = '';
  if (!Array.isArray(raw.sections)) {
    raw.sections = [
      { id: 'summary',        type: 'summary',        label: 'Summary',        visible: true },
      { id: 'education',      type: 'education',      label: 'Education',      visible: true },
      { id: 'experience',     type: 'experience',     label: 'Experience',     visible: true },
      { id: 'projects',       type: 'projects',       label: 'Projects',       visible: true },
      { id: 'skills',         type: 'skills',         label: 'Skills',         visible: true },
      { id: 'certifications', type: 'certifications', label: 'Certifications', visible: true },
    ];
  }
  return raw as unknown as ResumeData;
}

function load(): ResumeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw) as Record<string, unknown>);
  } catch (e) {
    console.warn('[FreeCV] Failed to load resume from localStorage — falling back to default.', e);
  }
  return defaultResume;
}

function save(data: ResumeData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      console.warn('[FreeCV] localStorage quota exceeded — attempting save without photo.');
      try {
        const fallback = { ...data, personalInfo: { ...data.personalInfo, photo: null } };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
        // Notify via a custom event so the UI can surface the warning
        window.dispatchEvent(new CustomEvent('freecv:quota-exceeded'));
      } catch { /* truly full — nothing we can do */ }
    }
  }
}

type StoreBase = { resume: ResumeData; history: ResumeData[]; future: ResumeData[] };

const withHistory = (s: StoreBase, resume: ResumeData, isDirty: boolean) => {
  save(resume);
  return {
    resume,
    lastSaved: new Date() as Date | null,
    isDirty,
    history: [...s.history, s.resume].slice(-MAX_HISTORY),
    future: [] as ResumeData[],
  };
};

const upd = (s: StoreBase, resume: ResumeData) => withHistory(s, resume, true);

interface ResumeStore {
  resume: ResumeData;
  lastSaved: Date | null;
  isPrinting: boolean;
  history: ResumeData[];
  future: ResumeData[];

  updatePersonalInfo: (field: keyof PersonalInfo, value: string | boolean | null) => void;
  addContactLink: (type: ContactLinkType) => void;
  updateContactLink: (id: string, patch: Partial<ContactLink>) => void;
  removeContactLink: (id: string) => void;
  reorderContactLinks: (links: ContactLink[]) => void;

  updateSummary: (v: string) => void;

  addEducation: () => void;
  updateEducation: (id: string, field: keyof EducationEntry, value: string) => void;
  updateEducationBullet: (id: string, idx: number, v: string) => void;
  addEducationBullet: (id: string) => void;
  removeEducationBullet: (id: string, idx: number) => void;
  removeEducation: (id: string) => void;

  addExperience: () => void;
  updateExperience: (id: string, field: keyof ExperienceEntry, value: string) => void;
  updateExperienceBullet: (id: string, idx: number, v: string) => void;
  addExperienceBullet: (id: string) => void;
  removeExperienceBullet: (id: string, idx: number) => void;
  removeExperience: (id: string) => void;

  addProject: () => void;
  updateProject: (id: string, field: keyof ProjectEntry, value: string) => void;
  updateProjectBullet: (id: string, idx: number, v: string) => void;
  addProjectBullet: (id: string) => void;
  removeProjectBullet: (id: string, idx: number) => void;
  removeProject: (id: string) => void;

  addSkillCategory: () => void;
  updateSkillCategory: (id: string, field: keyof SkillCategory, value: string) => void;
  updateSkillLevel: (id: string, level: number) => void;
  removeSkillCategory: (id: string) => void;

  addCertification: () => void;
  updateCertification: (id: string, field: keyof CertificationEntry, value: string) => void;
  removeCertification: (id: string) => void;

  addCustomSection: (title: string) => void;
  updateCustomSectionTitle: (id: string, title: string) => void;
  removeCustomSection: (id: string) => void;
  addCustomSectionEntry: (sectionId: string) => void;
  updateCustomSectionEntry: (sectionId: string, entryId: string, field: keyof CustomSectionEntry, value: string) => void;
  addCustomSectionEntryBullet: (sectionId: string, entryId: string) => void;
  updateCustomSectionEntryBullet: (sectionId: string, entryId: string, idx: number, value: string) => void;
  removeCustomSectionEntryBullet: (sectionId: string, entryId: string, idx: number) => void;
  removeCustomSectionEntry: (sectionId: string, entryId: string) => void;

  updateSettings: (patch: Partial<ResumeSettings>) => void;
  updateSettingsLive: (patch: Partial<ResumeSettings>) => void;
  setTemplate: (id: TemplateId) => void;

  updateSection: (id: string, patch: Partial<SectionConfig>) => void;
  reorderSections: (sections: SectionConfig[]) => void;
  deleteSection: (id: string) => void;
  restoreSection: (id: string) => void;

  setIsPrinting: (v: boolean) => void;
  setPreviewMode: (v: boolean) => void;
  isPreviewMode: boolean;
  isDirty: boolean;
  resetResume: () => void;
  loadFromData: (data: ResumeData, markDirty?: boolean) => void;

  undo: () => void;
  redo: () => void;
  clearDirty: () => void;
}

export const useResumeStore = create<ResumeStore>((set) => ({
  resume: load(),
  lastSaved: null,
  isPrinting: false,
  isPreviewMode: false,
  isDirty: false,
  history: [],
  future: [],

  updatePersonalInfo: (field, value) =>
    set(s => upd(s, { ...s.resume, personalInfo: { ...s.resume.personalInfo, [field]: value } })),

  addContactLink: (type) =>
    set(s => {
      const defaults: Partial<Record<ContactLinkType, string>> = {
        email: 'email@example.com', phone: '+1 (555) 000-0000', location: 'City, State',
        linkedin: 'linkedin.com/in/yourname', github: 'github.com/yourname',
        twitter: 'twitter.com/yourname', instagram: 'instagram.com/yourname',
        website: 'yourwebsite.com', portfolio: 'yourportfolio.com',
        orcid: 'orcid.org/0000-0000-0000-0000', youtube: 'youtube.com/@yourchannel',
        custom: 'Your Link',
      };
      const link: ContactLink = { id: nanoid(), type, value: defaults[type] || '', visible: true };
      return upd(s, { ...s.resume, personalInfo: { ...s.resume.personalInfo, contactLinks: [...s.resume.personalInfo.contactLinks, link] } });
    }),

  updateContactLink: (id, patch) =>
    set(s => upd(s, { ...s.resume, personalInfo: { ...s.resume.personalInfo, contactLinks: s.resume.personalInfo.contactLinks.map(l => l.id === id ? { ...l, ...patch } : l) } })),

  removeContactLink: (id) =>
    set(s => upd(s, { ...s.resume, personalInfo: { ...s.resume.personalInfo, contactLinks: s.resume.personalInfo.contactLinks.filter(l => l.id !== id) } })),

  reorderContactLinks: (links) =>
    set(s => upd(s, { ...s.resume, personalInfo: { ...s.resume.personalInfo, contactLinks: links } })),

  updateSummary: (v) => set(s => upd(s, { ...s.resume, summary: v })),

  // Education
  addEducation: () => set(s => upd(s, { ...s.resume, education: [...s.resume.education, { id: nanoid(), institution: 'University Name', location: 'City, State', degree: 'Degree in Major', startDate: 'Jan 2020', endDate: 'May 2024', gpa: '', link: '', bullets: [] }] })),
  updateEducation: (id, field, value) => set(s => upd(s, { ...s.resume, education: s.resume.education.map(e => e.id === id ? { ...e, [field]: value } : e) })),
  updateEducationBullet: (id, idx, v) => set(s => upd(s, { ...s.resume, education: s.resume.education.map(e => { if (e.id !== id) return e; const bullets = [...e.bullets]; bullets[idx] = v; return { ...e, bullets }; }) })),
  addEducationBullet: (id) => set(s => upd(s, { ...s.resume, education: s.resume.education.map(e => e.id === id ? { ...e, bullets: [...e.bullets, 'New bullet'] } : e) })),
  removeEducationBullet: (id, idx) => set(s => upd(s, { ...s.resume, education: s.resume.education.map(e => e.id !== id ? e : { ...e, bullets: e.bullets.filter((_, i) => i !== idx) }) })),
  removeEducation: (id) => set(s => upd(s, { ...s.resume, education: s.resume.education.filter(e => e.id !== id) })),

  // Experience
  addExperience: () => set(s => upd(s, { ...s.resume, experience: [...s.resume.experience, { id: nanoid(), company: 'Company Name', location: 'City, State', title: 'Job Title', startDate: 'Jan 2022', endDate: 'Present', link: '', bullets: ['Describe your key achievement with metrics'] }] })),
  updateExperience: (id, field, value) => set(s => upd(s, { ...s.resume, experience: s.resume.experience.map(e => e.id === id ? { ...e, [field]: value } : e) })),
  updateExperienceBullet: (id, idx, v) => set(s => upd(s, { ...s.resume, experience: s.resume.experience.map(e => { if (e.id !== id) return e; const bullets = [...e.bullets]; bullets[idx] = v; return { ...e, bullets }; }) })),
  addExperienceBullet: (id) => set(s => upd(s, { ...s.resume, experience: s.resume.experience.map(e => e.id === id ? { ...e, bullets: [...e.bullets, 'New bullet point'] } : e) })),
  removeExperienceBullet: (id, idx) => set(s => upd(s, { ...s.resume, experience: s.resume.experience.map(e => e.id !== id ? e : { ...e, bullets: e.bullets.filter((_, i) => i !== idx) }) })),
  removeExperience: (id) => set(s => upd(s, { ...s.resume, experience: s.resume.experience.filter(e => e.id !== id) })),

  // Projects
  addProject: () => set(s => upd(s, { ...s.resume, projects: [...s.resume.projects, { id: nanoid(), name: 'Project Name', technologies: 'Tech Stack', link: '', bullets: ['Describe what you built and the impact'] }] })),
  updateProject: (id, field, value) => set(s => upd(s, { ...s.resume, projects: s.resume.projects.map(p => p.id === id ? { ...p, [field]: value } : p) })),
  updateProjectBullet: (id, idx, v) => set(s => upd(s, { ...s.resume, projects: s.resume.projects.map(p => { if (p.id !== id) return p; const bullets = [...p.bullets]; bullets[idx] = v; return { ...p, bullets }; }) })),
  addProjectBullet: (id) => set(s => upd(s, { ...s.resume, projects: s.resume.projects.map(p => p.id === id ? { ...p, bullets: [...p.bullets, 'New bullet'] } : p) })),
  removeProjectBullet: (id, idx) => set(s => upd(s, { ...s.resume, projects: s.resume.projects.map(p => p.id !== id ? p : { ...p, bullets: p.bullets.filter((_, i) => i !== idx) }) })),
  removeProject: (id) => set(s => upd(s, { ...s.resume, projects: s.resume.projects.filter(p => p.id !== id) })),

  // Skills
  addSkillCategory: () => set(s => upd(s, { ...s.resume, skills: [...s.resume.skills, { id: nanoid(), category: 'Category', skills: 'Skill 1, Skill 2, Skill 3' }] })),
  updateSkillCategory: (id, field, value) => set(s => upd(s, { ...s.resume, skills: s.resume.skills.map(sk => sk.id === id ? { ...sk, [field]: value } : sk) })),
  updateSkillLevel: (id, level) => set(s => upd(s, { ...s.resume, skills: s.resume.skills.map(sk => sk.id === id ? { ...sk, level } : sk) })),
  removeSkillCategory: (id) => set(s => upd(s, { ...s.resume, skills: s.resume.skills.filter(sk => sk.id !== id) })),

  // Certifications
  addCertification: () => set(s => upd(s, { ...s.resume, certifications: [...s.resume.certifications, { id: nanoid(), name: 'Certification Name', issuer: 'Issuing Org', date: '2024' }] })),
  updateCertification: (id, field, value) => set(s => upd(s, { ...s.resume, certifications: s.resume.certifications.map(c => c.id === id ? { ...c, [field]: value } : c) })),
  removeCertification: (id) => set(s => upd(s, { ...s.resume, certifications: s.resume.certifications.filter(c => c.id !== id) })),

  // Custom Sections
  addCustomSection: (title) => {
    const secId = nanoid();
    const firstEntry: CustomSectionEntry = { id: nanoid(), sectionId: secId, heading: 'Entry Heading', subheading: '', date: '', bullets: ['Describe your achievement or activity'] };
    const sec: CustomSection = { id: secId, title, entries: [firstEntry] };
    set(s => {
      const newSec: SectionConfig = { id: secId, type: 'custom', label: title, visible: true };
      return upd(s, { ...s.resume, customSections: [...s.resume.customSections, sec], sections: [...s.resume.sections, newSec] });
    });
  },
  updateCustomSectionTitle: (id, title) =>
    set(s => upd(s, { ...s.resume, customSections: s.resume.customSections.map(cs => cs.id === id ? { ...cs, title } : cs), sections: s.resume.sections.map(sec => sec.id === id ? { ...sec, label: title } : sec) })),
  removeCustomSection: (id) =>
    set(s => upd(s, { ...s.resume, customSections: s.resume.customSections.filter(cs => cs.id !== id), sections: s.resume.sections.filter(sec => sec.id !== id) })),
  addCustomSectionEntry: (sectionId) =>
    set(s => upd(s, { ...s.resume, customSections: s.resume.customSections.map(cs => cs.id !== sectionId ? cs : { ...cs, entries: [...cs.entries, { id: nanoid(), sectionId, heading: 'New Entry', subheading: '', date: '', bullets: [] }] }) })),
  updateCustomSectionEntry: (sectionId, entryId, field, value) =>
    set(s => upd(s, { ...s.resume, customSections: s.resume.customSections.map(cs => cs.id !== sectionId ? cs : { ...cs, entries: cs.entries.map(e => e.id !== entryId ? e : { ...e, [field]: value }) }) })),
  addCustomSectionEntryBullet: (sectionId, entryId) =>
    set(s => upd(s, { ...s.resume, customSections: s.resume.customSections.map(cs => cs.id !== sectionId ? cs : { ...cs, entries: cs.entries.map(e => e.id !== entryId ? e : { ...e, bullets: [...e.bullets, 'New bullet'] }) }) })),
  updateCustomSectionEntryBullet: (sectionId, entryId, idx, value) =>
    set(s => upd(s, { ...s.resume, customSections: s.resume.customSections.map(cs => cs.id !== sectionId ? cs : { ...cs, entries: cs.entries.map(e => { if (e.id !== entryId) return e; const bullets = [...e.bullets]; bullets[idx] = value; return { ...e, bullets }; }) }) })),
  removeCustomSectionEntryBullet: (sectionId, entryId, idx) =>
    set(s => upd(s, { ...s.resume, customSections: s.resume.customSections.map(cs => cs.id !== sectionId ? cs : { ...cs, entries: cs.entries.map(e => e.id !== entryId ? e : { ...e, bullets: e.bullets.filter((_, i) => i !== idx) }) }) })),
  removeCustomSectionEntry: (sectionId, entryId) =>
    set(s => upd(s, { ...s.resume, customSections: s.resume.customSections.map(cs => cs.id !== sectionId ? cs : { ...cs, entries: cs.entries.filter(e => e.id !== entryId) }) })),

  // Settings
  updateSettings: (patch) => set(s => upd(s, { ...s.resume, settings: { ...s.resume.settings, ...patch } })),
  // Live update: mutates settings in place without creating an undo entry or saving.
  // Use during drag/scrub; call updateSettings with the final value on mouseup/blur.
  updateSettingsLive: (patch) => set(s => ({ resume: { ...s.resume, settings: { ...s.resume.settings, ...patch } } })),
  setTemplate: (id) => set(s => upd(s, { ...s.resume, settings: { ...s.resume.settings, template: id } })),

  // Sections
  updateSection: (id, patch) => set(s => upd(s, { ...s.resume, sections: s.resume.sections.map(sec => sec.id === id ? { ...sec, ...patch } : sec) })),
  reorderSections: (sections) => set(s => upd(s, { ...s.resume, sections })),

  deleteSection: (id) => set(s => {
    const section = s.resume.sections.find(sec => sec.id === id);
    if (!section) return {};
    const isCustom = section.type === 'custom';
    const newResume: ResumeData = {
      ...s.resume,
      sections: s.resume.sections.filter(sec => sec.id !== id),
      ...(isCustom ? { customSections: s.resume.customSections.filter(cs => cs.id !== id) } : {}),
    };
    return withHistory(s, newResume, true);
  }),

  restoreSection: (id) => set(s => {
    if (s.resume.sections.some(sec => sec.id === id)) return {};
    const config = DEFAULT_SECTION_CONFIGS[id];
    if (!config) return {};
    return withHistory(s, { ...s.resume, sections: [...s.resume.sections, config] }, true);
  }),

  setIsPrinting: (v) => set({ isPrinting: v }),
  setPreviewMode: (v) => set({ isPreviewMode: v }),

  resetResume: () => {
    save(defaultResume);
    set({ resume: { ...defaultResume }, lastSaved: new Date(), isDirty: false, history: [], future: [] });
  },

  loadFromData: (data, markDirty = false) => {
    const d = structuredClone(data) as ResumeData & { personalInfo: PersonalInfo & Record<string, unknown> };
    if (d.personalInfo.showPhoto === undefined) d.personalInfo.showPhoto = true;
    d.education = d.education.map(e => ({ ...e, link: e.link ?? '' }));
    d.experience = d.experience.map(e => ({ ...e, link: e.link ?? '' }));
    save(d);
    set({ resume: d, lastSaved: new Date(), isDirty: markDirty, history: [], future: [] });
  },

  undo: () => set(s => {
    if (s.history.length === 0) return {};
    const prev = s.history[s.history.length - 1];
    const newHistory = s.history.slice(0, -1);
    save(prev);
    return {
      resume: prev,
      history: newHistory,
      future: [s.resume, ...s.future].slice(0, MAX_HISTORY),
      isDirty: true,
      lastSaved: new Date(),
    };
  }),

  clearDirty: () => set({ isDirty: false }),

  redo: () => set(s => {
    if (s.future.length === 0) return {};
    const next = s.future[0];
    const newFuture = s.future.slice(1);
    save(next);
    return {
      resume: next,
      history: [...s.history, s.resume].slice(-MAX_HISTORY),
      future: newFuture,
      isDirty: true,
      lastSaved: new Date(),
    };
  }),
}));

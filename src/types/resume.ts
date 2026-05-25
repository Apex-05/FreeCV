export type ContactLinkType =
  | 'email' | 'phone' | 'location'
  | 'linkedin' | 'github' | 'twitter' | 'instagram'
  | 'website' | 'portfolio' | 'orcid' | 'youtube' | 'custom';

export interface ContactLink {
  id: string;
  type: ContactLinkType;
  value: string;
  label?: string;
  visible: boolean;
}

export interface PersonalInfo {
  name: string;
  title: string;
  photo: string | null;
  showPhoto: boolean;
  contactLinks: ContactLink[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  location: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa: string;
  link: string;
  bullets: string[];
}

export interface ExperienceEntry {
  id: string;
  company: string;
  location: string;
  title: string;
  startDate: string;
  endDate: string;
  link: string;
  bullets: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  technologies: string;
  link: string;
  bullets: string[];
}

export interface SkillCategory {
  id: string;
  category: string;
  skills: string;
  level?: number;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface CustomSectionEntry {
  id: string;
  sectionId: string;
  heading: string;
  subheading: string;
  date: string;
  bullets: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  entries: CustomSectionEntry[];
}

export type SectionType =
  | 'summary'
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'custom';

export interface SectionConfig {
  id: string;
  type: SectionType;
  label: string;
  visible: boolean;
}

export interface ResumeSettings {
  fontSize: number;
  lineHeight: number;
  topMargin: number;
  sectionSpacing: number;
  fontFamily: string;
  accentColor: string;
  columnBgColor?: string;
  template: TemplateId;
  photoShape: 'circle' | 'square' | 'rounded';
  photoPosition: string;
  photoSize: number;
  bulletStyle: '•' | '▸' | '–' | '▪' | '◦' | '';
  sideMargin: number;
}

export type TemplateId =
  | 'awesomecv'
  | 'jake'
  | 'deedy'
  | 'twentyseconds'
  | 'sb2nov'
  | 'friggeri'
  | 'academiccv'
  | 'hipster'
  | 'moderncv'
  | 'altacv';

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: SkillCategory[];
  certifications: CertificationEntry[];
  customSections: CustomSection[];
  sections: SectionConfig[];
  settings: ResumeSettings;
}

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'academic' | 'minimal';
  tags: string[];
  accentColor: string;
  fontFamily: string;
  preview: string;
}

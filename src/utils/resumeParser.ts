import type { ResumeData, ContactLink, ContactLinkType } from '../types/resume';
import { defaultResume } from '../data/defaultResume';
import { nanoid } from './nanoid';

type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };

export interface ParseResult {
  data: ResumeData;
  quality: number; // 0–100
}

function isDate(s: string): boolean {
  return /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december|\d{4})\b/i.test(s);
}

function isSectionHeader(line: string): string | null {
  const headers: Record<string, string> = {
    'education': 'education', 'academic background': 'education', 'academic': 'education', 'academics': 'education',
    'experience': 'experience', 'work experience': 'experience', 'employment': 'experience', 'professional experience': 'experience', 'work history': 'experience', 'internships': 'experience', 'internship': 'experience',
    'projects': 'projects', 'project': 'projects', 'personal projects': 'projects', 'key projects': 'projects',
    'skills': 'skills', 'technical skills': 'skills', 'core competencies': 'skills', 'expertise': 'skills', 'technologies': 'skills',
    'certifications': 'certifications', 'certificates': 'certifications', 'awards & certifications': 'certifications',
    'summary': 'summary', 'objective': 'summary', 'profile': 'summary', 'about': 'summary', 'professional summary': 'summary', 'career objective': 'summary',
    'co-curricular': 'custom', 'co curricular': 'custom', 'extracurricular': 'custom', 'extra-curricular activities': 'custom',
    'volunteer': 'custom', 'volunteer work': 'custom', 'publications': 'custom', 'research': 'custom',
    'awards': 'custom', 'awards & honors': 'custom', 'honors': 'custom', 'achievements': 'custom',
    'languages': 'custom', 'interests': 'custom', 'hobbies': 'custom', 'references': 'custom',
    'leadership': 'custom', 'activities': 'custom', 'conferences': 'custom', 'presentations': 'custom',
  };
  const clean = line.trim().toLowerCase().replace(/[:\-_\.]+$/g, '').trim();
  return headers[clean] ?? null;
}

function makeLink(type: ContactLinkType, value: string): ContactLink {
  return { id: nanoid(), type, value: value.trim(), visible: true };
}

function extractContactLinks(headerLines: string[]): ContactLink[] {
  const text = headerLines.join('\n');
  const links: ContactLink[] = [];

  const emailM = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  if (emailM) links.push(makeLink('email', emailM[0]));

  const phoneM = text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/);
  if (phoneM) links.push(makeLink('phone', phoneM[0].trim()));

  const linkedinM = text.match(/linkedin\.com\/in\/[\w%-]+/i);
  if (linkedinM) links.push(makeLink('linkedin', linkedinM[0]));

  const githubM = text.match(/github\.com\/[\w-]+/i);
  if (githubM) links.push(makeLink('github', githubM[0]));

  const websiteM = text.match(/(?:portfolio|website)?:?\s*(https?:\/\/(?!linkedin|github)[\w.-]+\.[a-z]{2,}[^\s]*)/i);
  if (websiteM) links.push(makeLink('website', websiteM[1]));

  for (const line of headerLines.slice(1, 6)) {
    const locM = line.match(/^([A-Z][a-zA-Z\s]+,\s*(?:[A-Z]{2}|[A-Za-z\s]+))(?:\s*[\|·•]|$)/);
    if (locM && locM[1].length < 50 && !emailM?.[0].includes(locM[1])) {
      links.push(makeLink('location', locM[1].trim()));
      break;
    }
  }

  return links;
}

function parseDateRange(text: string): { startDate: string; endDate: string } {
  const m = text.match(/([A-Za-z]+\.?\s*\d{4}|\d{4})\s*[-–—to]+\s*([A-Za-z]+\.?\s*\d{4}|\d{4}|[Pp]resent|[Cc]urrent|[Nn]ow|[Oo]ngoing)/);
  if (m) return { startDate: m[1].trim(), endDate: m[2].trim() };
  const yearM = text.match(/(\d{4})/);
  return { startDate: yearM ? yearM[1] : '', endDate: '' };
}

// ── Quality scoring ────────────────────────────────────────────────────────────

function scoreQuality(
  name: string,
  title: string,
  links: ContactLink[],
  summary: string,
  experience: unknown[],
  education: unknown[],
  skills: unknown[],
  projects: unknown[],
  certifications: unknown[],
  customSections: unknown[],
): number {
  let score = 0;

  // Name (15 pts)
  const hasName = name.trim().length > 0 && name !== 'Your Name';
  if (hasName) score += 15;

  // Title (5 pts)
  if (title.trim().length > 2) score += 5;

  // Contact (up to 20 pts)
  const hasEmail    = links.some(l => l.type === 'email');
  const hasPhone    = links.some(l => l.type === 'phone');
  const hasLinkedin = links.some(l => l.type === 'linkedin');
  const hasGithub   = links.some(l => l.type === 'github');
  if (hasEmail)    score += 8;
  if (hasPhone)    score += 6;
  if (hasLinkedin) score += 4;
  if (hasGithub)   score += 2;

  // Summary (10 pts)
  if (summary.trim().length > 20) score += 10;

  // Experience (20 pts)
  if (experience.length >= 1) score += 10;
  if (experience.length >= 2) score += 10;

  // Education (10 pts)
  if (education.length >= 1) score += 10;

  // Skills (10 pts)
  if (skills.length >= 1) score += 5;
  if (skills.length >= 3) score += 5;

  // Projects (5 pts)
  if (projects.length >= 1) score += 5;

  // Certifications / custom sections (5 pts)
  if (certifications.length > 0 || customSections.length > 0) score += 5;

  return Math.min(100, score);
}

// ── PDF parser ──────────────────────────────────────────────────────────────

export async function parsePdf(file: File): Promise<ParseResult> {
  if (file.size === 0) throw new Error('The PDF file is empty.');

  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();

  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  } catch {
    throw new Error('Could not read PDF. The file may be password-protected or corrupted.');
  }

  const pageTexts: string[] = [];
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      try {
        const content = await page.getTextContent();
        type Item = { str: string; transform: number[] };
        const items = content.items as Item[];
        const lineMap = new Map<number, string[]>();
        for (const item of items) {
          if (!item.str.trim()) continue;
          const y = Math.round(item.transform[5] / 5) * 5;
          const row = lineMap.get(y) ?? [];
          row.push(item.str);
          lineMap.set(y, row);
        }
        const sortedLines = [...lineMap.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([, parts]) => parts.join(' ').replace(/\s+/g, ' ').trim())
          .filter(Boolean);
        pageTexts.push(sortedLines.join('\n'));
      } finally {
        page.cleanup();
      }
    }
  } finally {
    pdf.destroy();
  }

  const combined = pageTexts.join('\n');
  if (combined.trim().length < 20) throw new Error('PDF appears to have no extractable text. It may be a scanned image.');

  return parseText(combined);
}

// ── DOCX parser ──────────────────────────────────────────────────────────────

export async function parseDocx(file: File): Promise<ParseResult> {
  if (file.size === 0) throw new Error('The DOCX file is empty.');

  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();

  let result;
  try {
    result = await mammoth.extractRawText({ arrayBuffer });
  } catch {
    throw new Error('Could not read DOCX. The file may be corrupted or not a valid Word document.');
  }

  if (!result.value.trim()) throw new Error('DOCX appears to contain no text content.');

  return parseText(result.value);
}

// ── Main text parser ─────────────────────────────────────────────────────────

export function parseText(rawText: string): ParseResult {
  const lines = rawText
    .split('\n')
    .map(l => l.replace(/\r/g, '').trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) return { data: { ...defaultResume }, quality: 0 };

  type ExpEntry = { id: string; company: string; location: string; title: string; startDate: string; endDate: string; link: string; bullets: string[] };
  type EduEntry = { id: string; institution: string; location: string; degree: string; startDate: string; endDate: string; gpa: string; link: string; bullets: string[] };
  type ProjEntry = { id: string; name: string; technologies: string; link: string; bullets: string[] };
  type SkillCat = { id: string; category: string; skills: string };
  type CertEntry = { id: string; name: string; issuer: string; date: string };

  const data: DeepPartial<ResumeData> = {
    personalInfo: { name: '', title: '', photo: null, showPhoto: true, contactLinks: [] },
    summary: '', education: [], experience: [], projects: [], skills: [], certifications: [], customSections: [],
  };

  // ── Header extraction ─────────────────────────────────────────────────────
  data.personalInfo!.name = lines[0];

  if (lines[1] && !isDate(lines[1]) && !/[\d@\+]/.test(lines[1].substring(0, 3)) && lines[1].length < 80) {
    const sectionTest = isSectionHeader(lines[1]);
    if (!sectionTest) data.personalInfo!.title = lines[1];
  }

  const headerLinks = extractContactLinks(lines.slice(0, 8));
  data.personalInfo!.contactLinks = headerLinks;

  // ── Section parsing ───────────────────────────────────────────────────────
  let currentSection: string | null = null;
  let currentSectionLabel: string = '';
  let currentEntry: Record<string, unknown> | null = null;
  let customSectionId: string | null = null;

  const flushEntry = () => {
    if (!currentSection || !currentEntry) return;
    if (currentSection === 'experience' && (currentEntry.company || currentEntry.title)) {
      (data.experience as ExpEntry[]).push(currentEntry as ExpEntry);
    } else if (currentSection === 'education' && currentEntry.institution) {
      (data.education as EduEntry[]).push(currentEntry as EduEntry);
    } else if (currentSection === 'projects' && currentEntry.name) {
      (data.projects as ProjEntry[]).push(currentEntry as ProjEntry);
    }
    currentEntry = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sectionType = isSectionHeader(line);

    if (sectionType) {
      flushEntry();
      currentSection = sectionType;
      currentSectionLabel = line.trim().replace(/[:\-_\.]+$/, '');
      currentEntry = null;

      if (sectionType === 'custom') {
        customSectionId = nanoid();
        (data.customSections as ResumeData['customSections']).push({ id: customSectionId, title: currentSectionLabel, entries: [] });
      }
      continue;
    }

    if (!currentSection) continue;

    const isBullet = /^[•\-\*◦▸▪➤►→]\s/.test(line) || /^\d+\.\s/.test(line);
    const hasDate = isDate(line) && line.length < 70;

    if (currentSection === 'summary') {
      data.summary = ((data.summary as string) || '') + (data.summary ? ' ' : '') + line;
      continue;
    }

    if (currentSection === 'skills') {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0 && colonIdx < 40) {
        (data.skills as SkillCat[]).push({ id: nanoid(), category: line.slice(0, colonIdx).trim(), skills: line.slice(colonIdx + 1).trim() });
      } else if (!isBullet && line.length > 2) {
        (data.skills as SkillCat[]).push({ id: nanoid(), category: '', skills: line });
      }
      continue;
    }

    if (currentSection === 'certifications') {
      if (!isBullet) {
        const m = line.match(/^(.*?)\s*[-–|]\s*(.+)$/);
        if (m) (data.certifications as CertEntry[]).push({ id: nanoid(), name: m[1].trim(), issuer: m[2].trim(), date: '' });
        else (data.certifications as CertEntry[]).push({ id: nanoid(), name: line, issuer: '', date: '' });
      }
      continue;
    }

    if (currentSection === 'custom') {
      const cs = (data.customSections as ResumeData['customSections']).find(s => s.id === customSectionId);
      if (!cs) continue;
      if (isBullet) {
        const text = line.replace(/^[•\-\*◦▸▪➤►→]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        if (cs.entries.length === 0) cs.entries.push({ id: nanoid(), sectionId: cs.id, heading: '', subheading: '', date: '', bullets: [text] });
        else cs.entries[cs.entries.length - 1].bullets.push(text);
      } else if (hasDate) {
        if (cs.entries.length > 0) cs.entries[cs.entries.length - 1].date = line;
      } else {
        if (cs.entries.length > 0 && !cs.entries[cs.entries.length - 1].subheading && !cs.entries[cs.entries.length - 1].heading) {
          cs.entries[cs.entries.length - 1].heading = line;
        } else {
          cs.entries.push({ id: nanoid(), sectionId: cs.id, heading: line, subheading: '', date: '', bullets: [] });
        }
      }
      continue;
    }

    if (currentSection === 'experience') {
      if (!currentEntry && !isBullet) {
        flushEntry();
        const atMatch = line.match(/^(.+?)\s+(?:@|at)\s+(.+)$/i);
        const dashMatch = !atMatch && line.match(/^(.+?)\s+[-–—]\s+(.+)$/);
        if (atMatch) {
          currentEntry = { id: nanoid(), title: atMatch[1].trim(), company: atMatch[2].trim(), location: '', startDate: '', endDate: '', link: '', bullets: [] };
        } else if (dashMatch && !isDate(dashMatch[2]) && dashMatch[2].length < 50) {
          currentEntry = { id: nanoid(), title: dashMatch[1].trim(), company: dashMatch[2].trim(), location: '', startDate: '', endDate: '', link: '', bullets: [] };
        } else {
          currentEntry = { id: nanoid(), company: line, title: '', location: '', startDate: '', endDate: '', link: '', bullets: [] };
        }
      } else if (currentEntry) {
        const e = currentEntry as ExpEntry;
        if (hasDate && !e.startDate) {
          const dates = parseDateRange(line);
          e.startDate = dates.startDate;
          e.endDate = dates.endDate;
          const locPart = line.replace(dates.startDate, '').replace(dates.endDate, '').replace(/[-–—to\s]+/g, ' ').trim();
          if (locPart && locPart.length < 40 && !isDate(locPart)) e.location = locPart;
        } else if (!e.title && !isBullet && !hasDate) {
          e.title = line;
        } else if (isBullet) {
          e.bullets.push(line.replace(/^[•\-\*◦▸▪➤►→]\s*/, '').replace(/^\d+\.\s*/, '').trim());
        } else if (!isBullet && !hasDate && e.title && !e.location && line.length < 60) {
          if (/,\s*[A-Z]/.test(line)) e.location = line;
        }
      }
      continue;
    }

    if (currentSection === 'education') {
      if (!currentEntry && !isBullet) {
        flushEntry();
        currentEntry = { id: nanoid(), institution: line, location: '', degree: '', startDate: '', endDate: '', gpa: '', link: '', bullets: [] };
      } else if (currentEntry) {
        const e = currentEntry as EduEntry;
        if (hasDate) {
          const dates = parseDateRange(line);
          e.startDate = dates.startDate;
          e.endDate = dates.endDate;
        } else if (/gpa|cgpa|grade/i.test(line)) {
          const gpaM = line.match(/(\d+\.\d+)/);
          if (gpaM) e.gpa = gpaM[0];
          else if (!e.degree) e.degree = line;
        } else if (!e.degree && !isBullet) {
          e.degree = line;
        } else if (isBullet) {
          e.bullets.push(line.replace(/^[•\-\*◦▸▪➤►→]\s*/, '').trim());
        } else if (!e.location && /,/.test(line) && line.length < 50) {
          e.location = line;
        }
      }
      continue;
    }

    if (currentSection === 'projects') {
      if (!currentEntry && !isBullet) {
        flushEntry();
        const pipeM = line.match(/^([^|]+?)\s*\|\s*(.+)$/);
        const dashM = !pipeM && line.match(/^([^-]+?)\s+-\s+(.+)$/);
        if (pipeM) {
          currentEntry = { id: nanoid(), name: pipeM[1].trim(), technologies: pipeM[2].trim(), link: '', bullets: [] };
        } else if (dashM && dashM[2].length < 80) {
          currentEntry = { id: nanoid(), name: dashM[1].trim(), technologies: dashM[2].trim(), link: '', bullets: [] };
        } else {
          currentEntry = { id: nanoid(), name: line, technologies: '', link: '', bullets: [] };
        }
      } else if (currentEntry) {
        const e = currentEntry as ProjEntry;
        if (isBullet) {
          e.bullets.push(line.replace(/^[•\-\*◦▸▪➤►→]\s*/, '').replace(/^\d+\.\s*/, '').trim());
        } else if (!e.technologies && !isBullet) {
          e.technologies = line;
        } else if (/https?:\/\//.test(line) || /github\.com|vercel|netlify/i.test(line)) {
          e.link = line.trim();
        }
      }
      continue;
    }
  }

  flushEntry();

  // ── Build final result ───────────────────────────────────────────────────────
  const parsedExp   = data.experience as ResumeData['experience'];
  const parsedEdu   = data.education  as ResumeData['education'];
  const parsedProj  = data.projects   as ResumeData['projects'];
  const parsedSkill = data.skills     as ResumeData['skills'];
  const parsedCert  = data.certifications as ResumeData['certifications'];
  const customSections = (data.customSections as ResumeData['customSections']) ?? [];

  const extraSections = customSections.map(cs => ({ id: cs.id, label: cs.title, type: 'custom' as const, visible: true }));

  const parsedName  = (data.personalInfo!.name  as string) || 'Your Name';
  const parsedTitle = (data.personalInfo!.title as string) || '';
  const parsedLinks = (data.personalInfo!.contactLinks as ContactLink[]);
  const parsedSummary = ((data.summary as string) || '').trim();

  const quality = scoreQuality(
    parsedName,
    parsedTitle,
    parsedLinks,
    parsedSummary,
    parsedExp,
    parsedEdu,
    parsedSkill,
    parsedProj,
    parsedCert,
    customSections,
  );

  const result: ResumeData = {
    ...defaultResume,
    personalInfo: {
      name: parsedName,
      title: parsedTitle,
      photo: null,
      showPhoto: true,
      contactLinks: parsedLinks.length > 0 ? parsedLinks : defaultResume.personalInfo.contactLinks,
    },
    summary: parsedSummary,
    education:      parsedEdu.length   > 0 ? parsedEdu   : defaultResume.education,
    experience:     parsedExp.length   > 0 ? parsedExp   : defaultResume.experience,
    projects:       parsedProj.length  > 0 ? parsedProj  : defaultResume.projects,
    skills:         parsedSkill.length > 0 ? parsedSkill : defaultResume.skills,
    certifications: parsedCert.length  > 0 ? parsedCert  : [],
    customSections,
    sections: [...defaultResume.sections, ...extraSections],
    settings: defaultResume.settings,
  };

  return { data: result, quality };
}

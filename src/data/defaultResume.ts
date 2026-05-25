import type { ResumeData } from '../types/resume';
import { nanoid } from '../utils/nanoid';

export const defaultResume: ResumeData = {
  personalInfo: {
    name: 'Alex Johnson',
    title: 'Software Engineer',
    photo: null,
    showPhoto: true,
    contactLinks: [
      { id: nanoid(), type: 'email', value: 'alex@example.com', visible: true },
      { id: nanoid(), type: 'phone', value: '(555) 123-4567', visible: true },
      { id: nanoid(), type: 'location', value: 'San Francisco, CA', visible: true },
      { id: nanoid(), type: 'linkedin', value: 'linkedin.com/in/alexjohnson', visible: true },
      { id: nanoid(), type: 'github', value: 'github.com/alexjohnson', visible: true },
    ],
  },
  summary:
    'Results-driven software engineer with 4+ years of experience building scalable web applications. Passionate about clean code, system design, and delivering exceptional user experiences.',
  education: [
    {
      id: nanoid(),
      institution: 'University of California, Berkeley',
      location: 'Berkeley, CA',
      degree: 'B.S. in Computer Science',
      startDate: 'Aug 2016',
      endDate: 'May 2020',
      gpa: '3.8',
      link: '',
      bullets: ['Relevant Coursework: Algorithms, Systems, Machine Learning, Databases'],
    },
  ],
  experience: [
    {
      id: nanoid(),
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      title: 'Senior Software Engineer',
      startDate: 'Jun 2022',
      endDate: 'Present',
      link: '',
      bullets: [
        'Led development of microservices architecture serving 2M+ daily active users, reducing latency by 40%',
        'Mentored 4 junior engineers and established code review practices adopted team-wide',
        'Built real-time data pipeline processing 500K events/day using Kafka and Python',
      ],
    },
    {
      id: nanoid(),
      company: 'StartupXYZ',
      location: 'San Jose, CA',
      title: 'Software Engineer',
      startDate: 'Jul 2020',
      endDate: 'May 2022',
      link: '',
      bullets: [
        'Developed React frontend with TypeScript, improving user retention by 25%',
        'Designed and implemented REST APIs using Node.js and PostgreSQL',
        'Reduced CI/CD pipeline runtime by 60% through parallelization and caching strategies',
      ],
    },
  ],
  projects: [
    {
      id: nanoid(),
      name: 'CloudDeploy',
      technologies: 'React, Node.js, AWS, Docker, Terraform',
      link: 'github.com/alex/clouddeploy',
      bullets: [
        'Built an automated deployment platform that reduced deployment time from 45 min to 3 min',
        'Achieved 99.9% uptime with automated rollback and health monitoring',
      ],
    },
    {
      id: nanoid(),
      name: 'DataViz Dashboard',
      technologies: 'Python, D3.js, FastAPI, PostgreSQL',
      link: '',
      bullets: [
        'Created an interactive analytics dashboard with real-time data visualizations',
        'Used by 500+ analysts to explore datasets with 10M+ rows',
      ],
    },
  ],
  skills: [
    { id: nanoid(), category: 'Languages', skills: 'Python, TypeScript, JavaScript, Go, SQL, Bash' },
    { id: nanoid(), category: 'Frameworks', skills: 'React, Node.js, FastAPI, Django, Next.js, Express' },
    { id: nanoid(), category: 'Tools & Cloud', skills: 'AWS, Docker, Kubernetes, Terraform, Git, PostgreSQL, Redis, Kafka' },
  ],
  certifications: [
    { id: nanoid(), name: 'AWS Solutions Architect – Associate', issuer: 'Amazon Web Services', date: '2023' },
  ],
  customSections: [],
  sections: [
    { id: 'summary', type: 'summary', label: 'Summary', visible: true },
    { id: 'education', type: 'education', label: 'Education', visible: true },
    { id: 'experience', type: 'experience', label: 'Experience', visible: true },
    { id: 'projects', type: 'projects', label: 'Projects', visible: true },
    { id: 'skills', type: 'skills', label: 'Skills', visible: true },
    { id: 'certifications', type: 'certifications', label: 'Certifications', visible: true },
  ],
  settings: {
    fontSize: 12,
    lineHeight: 1.4,
    topMargin: 6,
    sectionSpacing: 6,
    fontFamily: 'Inter',
    accentColor: '#6366f1',
    template: 'awesomecv',
    photoShape: 'circle',
    photoPosition: 'center top',
    photoSize: 100,
    bulletStyle: '•',
    sideMargin: 0,
    columnBgColor: '',
  },
};

# FreeCV

Free, browser-based resume builder. No account. No server. Everything stays local.

**Dev:** `npm run dev` → http://localhost:5173 &nbsp;|&nbsp; **Build:** `npm run build`

---

## Core

- Click any text on the resume to edit it inline — live preview updates instantly
- Undo / Redo (Ctrl+Z / Ctrl+Y) with up to 50 steps of history
- Auto-save to localStorage every 5 seconds
- Named save snapshots via the "Save" button
- Version history panel — browse and restore any past save
- Crash recovery — detects unsaved work from a closed session and offers to restore
- Multi-tab conflict detection — warns if another tab edited the resume
- Unsaved-changes guard — prompts before navigating away
- No signup, no account, no data ever sent to a server

---

## Templates (10)

- **Awesome CV** — dark header, colored accent bars, icon contact row (tech / software)
- **Jake's Resume** — single-column, ATS-optimised, zero visual noise (tech / ATS)
- **Deedy** — two-column 33/67, sidebar for education & skills (new grad / student)
- **Twenty Seconds** — dark sidebar, photo, skill dots, experience right panel (consulting)
- **SB2Nov** — left name, right contact table, double-rule header (finance / business)
- **Friggeri** — two-tone name header, dark sidebar, timeline experience (executive)
- **Academic CV** — serif typeface, date-hint column, gray contact band (research / PhD)
- **Hipster CV** — colorful sidebar, circular photo, rounded skill tags (creative / design)
- **ModernCV** — colored top stripe, date hints left, banking layout (general)
- **AltaCV** — two-column 62/38, skill rating dots, icon header (product / PM)
- Switch templates anytime — all content is preserved automatically
- "New blank resume" button with confirmation and save-first warning (PDF or JSON)

---

## Resume Sections

- Personal info — name, title, email, phone, location, website, LinkedIn, GitHub, photo
- Summary / objective
- Work experience — bullets, dates, location, company link
- Education — GPA, dates, institution link
- Skills — grouped by category, interactive skill-level dots / bars (click to set level)
- Projects — tech stack, dates, project link
- Certifications
- Custom sections — user-defined label + bullet list
- Drag-and-drop section reordering
- Show / hide individual sections without deleting them
- Restore deleted sections with one click

---

## Sidebar Panels

- **Guide** — how-to instructions
- **Contact** — manage photo, all contact links (drag to reorder, toggle visibility, delete)
- **Style** — accent color, font family, font size, line height, side margin, bullet style, photo shape
- **Sections** — reorder, toggle, delete, restore, add custom sections
- **Template** — switch templates, start a new blank resume
- **History** — browse and restore named saves and crash-recovery snapshots
- Sidebar is drag-resizable (220 – 480 px)

---

## Photo Editor

- Upload any image as a profile photo
- Crop, zoom, and rotate with a full in-canvas photo editor
- Toggle photo visibility without removing it

---

## Export

- Download PDF — pixel-perfect US Letter PDF via html2pdf.js
- Export JSON backup — portable full resume data file
- Import JSON backup — restore any previous resume
- Import `.docx` — auto-parsed into all resume fields via Mammoth.js
- Import `.txt` — smart section detection and field mapping
- Import PDF — routes directly to the PDF Direct Editor

---

## PDF Preview Modal

- Full-screen dark overlay showing the resume as a paper card
- No browser print dialog — contained in-app view
- Close with Escape key or backdrop click

---

## PDF Direct Editor

- Upload any PDF and edit its text directly in the browser
- Canvas-accurate rendering — logos, images, icons, badges, underlines, dividers all preserved
- Click any text element to edit inline
- Edited fields highlighted in green; reset all edits in one click
- Zoom in / out controls
- Toggle PDF canvas layer on / off
- Download the edited PDF
- Completely separate from the resume editor

---

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v3
- Zustand — state management + undo/redo history
- Framer Motion — animations
- @dnd-kit — drag and drop
- html2pdf.js — PDF export
- PDF.js — PDF parsing and canvas rendering
- Mammoth — `.docx` parsing
- React Hot Toast — notifications
- React Router v7
- Lucide React — icons

---

## Routes

| Path | Page |
|------|------|
| `/` | Home — template gallery, feature overview, import |
| `/editor` | Resume editor |
| `/pdf-editor` | PDF Direct Editor |

---

## Storage Keys (localStorage)

| Key | Contents |
|-----|----------|
| `freecv_resume` | Current resume data |
| `freecv_history` | Named save snapshots |
| `freecv_crash` | Crash recovery buffer |

---

Built by Adarsh Ranjan · Free forever

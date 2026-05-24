# FreeCV — Free Browser-Based Resume Editor

A fully offline, no-login resume builder. Click any text to edit, pick a template, download a pixel-perfect PDF. All data stays in your browser.

**Dev server:** `npm run dev` → http://localhost:5173  
**Build:** `npm run build`

---

## What You Can Do

### Editing the Resume (Canvas)
- **Click any text** on the resume to edit it inline (name, title, company, dates, bullet points, etc.)
- **Rich text formatting** — select text while editing to get a Bold / Italic / Underline toolbar
- **Bullets** — hover any bullet point to reveal a remove button; click `+ Add point` to add a new one
- **Press Enter** in a bullet to jump to the next bullet; **Backspace** on an empty bullet removes it
- **Press Escape** in any field to cancel and revert changes
- **Link icons** next to job titles, education, and projects — click to open the URL, right-click to edit

### Templates (Style Tab)
6 professionally designed templates, switchable at any time:
| Template | Best For |
|---|---|
| Modern Professional | Tech, business, general |
| Classic ATS | Finance, law, ATS-optimized |
| Minimal Clean | Design, consulting |
| Executive | Senior roles, leadership |
| Creative Sidebar | Designers, marketers |
| Academic | PhDs, research, academia |

### Styling (Style Tab)
- **18 fonts** — 11 sans-serif (Inter, Roboto, Lato, Open Sans, Source Sans 3, Nunito, DM Sans, Outfit, Plus Jakarta Sans, Raleway, Josefin Sans) + 7 serif (Georgia, Merriweather, Playfair Display, EB Garamond, Lora, Libre Baskerville, Crimson Text)
- **Font size** slider (9–14 px)
- **Line height** slider (1.0–2.0)
- **Top margin** and **Section spacing** sliders
- **Side padding** slider (adds horizontal breathing room)
- **12 accent colors** + custom color picker
- **Bullet style** — choose from •  ▸  –  ▪  ◦  or none
- **Photo shape** — circle, square, or rounded corners

### Profile Photo (Contact Tab)
- Upload a photo (any image format)
- **Crop, zoom, and rotate** with the full photo editor (click "Edit" in the Contact tab)
- **Reposition** — hover the photo on the canvas and click the Move icon to choose from 9 anchor positions (top-left, center, bottom-right, etc.)
- **Toggle visibility** — show or hide the photo without deleting it
- Change or remove at any time

### Contact & Social Links (Contact Tab)
Supported link types: Email · Phone · Location · LinkedIn · GitHub · Twitter/X · Instagram · Website · Portfolio · YouTube · ORCID · Custom

For each link:
- **Click the value** to edit it inline
- **Toggle visibility** — show/hide on the resume without removing it
- **Drag to reorder** the order links appear on the resume
- **Delete** individual links
- Add as many links as you want (including multiple custom links)

### Sections (Sections Tab)
- **Drag to reorder** any section (Summary, Education, Experience, Projects, Skills, Certifications, custom)
- **Apply Order** button — reorder is staged until you confirm; a Reset button discards pending changes
- **Toggle visibility** (eye icon) — hide/show a section without losing its content
- **Delete any section** — hover and click the trash icon; data is preserved
- **Restore deleted sections** — a restore panel appears at the bottom listing removed standard sections with one-click restore
- **Add custom sections** — type a name or pick from quick options (Co-curricular Activities, Volunteer Work, Publications, Awards, Languages, Hobbies, References, Conferences…)

### Undo / Redo
- **Ctrl+Z** — undo the last change (up to 50 steps)
- **Ctrl+Y** or **Ctrl+Shift+Z** — redo
- Undo/Redo buttons also visible in the top bar
- While typing inside a field, native browser undo works; store-level undo kicks in when you're not inside a field

### Import Resume (Top Bar → Import)
Import an existing resume and have it auto-populate all fields:
- **.pdf** — extracts text using PDF.js, reconstructs sections
- **.docx** — extracts text via Mammoth.js, preserves structure
- **.txt** — parses plain text with smart section detection

After parsing:
- A confirmation modal shows; choose to keep or skip any embedded photo
- All recognized sections are mapped to the correct resume fields
- Unknown section headers become custom sections automatically

### Export / Save
- **Download PDF** (top-right button) — pixel-perfect PDF at US Letter size
- **Save PDF** (folder icon button) — on Chrome/Edge uses the File System Access API to let you pick exactly where to save; falls back to a regular download on other browsers

### Auto-Save
- Every change is **automatically saved** to `localStorage` — no manual save needed
- Closing and reopening the tab restores exactly where you left off
- An **"Unsaved edits"** amber chip appears when content differs from the last imported/loaded state
- A **beforeunload warning** fires if you try to navigate away with unsaved structural changes

### Preview Mode
- Click **Preview** in the top bar to see the resume exactly as it will print (no edit handles, no UI overlays)
- Click **Edit** to go back to editing mode
- A small "Preview Mode" badge overlays the canvas so you know you're in preview

### Multi-Page Support
- If your content exceeds one page, **dashed page break lines** appear on the canvas showing exactly where pages will split
- Page number labels mark each break

### Reset
- **Reset** button in the top bar replaces all content with the built-in demo resume (Alex Johnson)
- Requires confirmation — your auto-saved data is still in localStorage until overwritten

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Enter` (in a field) | Confirm edit / move to next bullet |
| `Escape` (in a field) | Cancel edit, revert value |
| `Backspace` (empty bullet) | Remove bullet |

---

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| React + TypeScript | 18 | UI |
| Vite | latest | Build tool |
| Tailwind CSS | v3 | Styling |
| Zustand | latest | State management |
| Framer Motion | latest | Animations |
| @dnd-kit | latest | Drag-and-drop |
| html2pdf.js | latest | PDF generation |
| pdfjs-dist | 5.7.284 | PDF text extraction |
| mammoth.js | latest | DOCX parsing |
| lucide-react | 1.16.0 | Icons (note: brand icons are custom SVGs in `src/components/icons/social.tsx`) |
| react-hot-toast | latest | Toast notifications |

---

## Project Structure (Key Files)

```
src/
  types/resume.ts          — All TypeScript interfaces
  store/resumeStore.ts     — Zustand store (undo/redo history, all actions)
  data/defaultResume.ts    — Default demo resume content
  data/templateConfigs.ts  — Template metadata
  utils/pdfGenerator.ts    — downloadPDF + savePDFDirect (FSAPI)
  utils/resumeParser.ts    — PDF / DOCX / TXT import parser
  utils/nanoid.ts          — ID generator
  components/
    icons/social.tsx       — Custom SVGs: Github, Linkedin, Twitter, Instagram, Youtube, Orcid
    editor/
      TopBar.tsx           — Undo/Redo, Save PDF, Import, Reset, Download
      Sidebar.tsx          — Resizable sidebar (default 320px, drag to 220–480px)
      PhotoEditorModal.tsx — Crop / zoom / rotate photo editor
      preview/
        ResumePreview.tsx        — Canvas + page break indicators
        EditableField.tsx        — Inline edit + rich text toolbar
        templates/               — 6 template components
        shared/
          ContactRow.tsx         — Renders contact links in templates
          PhotoUpload.tsx        — Photo with reposition overlay
          CustomSectionBlock.tsx — Renders custom sections
          EntryLink.tsx          — External link icon next to entries
      sidebar/
        GuidePanel.tsx      — How-to guide with hero image
        ContactPanel.tsx    — Photo + contact link management
        SettingsPanel.tsx   — Fonts, colors, spacing, shapes
        SectionsPanel.tsx   — Reorder, delete, restore, add custom sections
  pages/
    HomePage.tsx   — Landing page with template gallery + import
    EditorPage.tsx — Editor shell with keyboard shortcuts
public/
  pdf.worker.min.mjs  — PDF.js worker (required for PDF import)
```

---

## Data Storage

- **localStorage key:** `freecv_resume_v2`
- All resume content, settings, and contact links are serialized as JSON
- Migration function handles old formats automatically
- Undo/redo history is **in-memory only** (lost on page refresh — by design, to keep localStorage small)

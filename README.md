# FreeCV

Free, browser-based resume builder. No account. No server. Everything stays local.

**Dev:** `npm run dev` → http://localhost:5173 &nbsp;|&nbsp; **Build:** `npm run build`

---

## Core

- Click any text on the resume to edit it inline — live preview updates instantly
- Undo / Redo (Ctrl+Z / Ctrl+Y) with up to 50 steps of history
- Auto-save to localStorage every 5 seconds
- Named save snapshots via the "Save" button
- Version history panel — browse and restore any past save (auto / manual / import / crash)
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
- Section order is respected across all templates (drag-and-drop reordering)

---

## Resume Sections

- Personal info — name, title, email, phone, location, website, LinkedIn, GitHub, photo
- Summary / objective
- Work experience — bullets, dates, location, company link
- Education — GPA, dates, institution link
- Skills — grouped by category, interactive skill-level dots / bars (click to set level)
- Projects — tech stack tags (individually removable, inline add), dates, project link
- Certifications
- Custom sections — user-defined label + bullet list
- Drag-and-drop section reordering — order applied consistently in all templates
- Show / hide individual sections without deleting them
- Restore deleted sections with one click

---

## Sidebar Panels

- **Guide** — how-to instructions
- **Contact** — manage photo, all contact links (drag to reorder, toggle visibility, delete)
- **Style** — full live-preview controls (no lag while dragging):
  - Accent color — 12 presets + custom color picker
  - Column background color — independent sidebar color for two-column templates (Friggeri, Deedy, TwentySeconds, Hipster)
  - Font family — grouped sans-serif / serif picker with live preview
  - Font size, line height, top margin, section spacing, side padding — all update live while dragging, undo entry only on release
  - Bullet style — 5 options (•  ▸  –  ▪  ◦)
  - Photo shape — circle, square, rounded
- **Sections** — reorder, toggle, delete, restore, add custom sections
- **Template** — switch templates, start a new blank resume
- **History** — browse and restore named saves and crash-recovery snapshots; filter by type; rename or delete entries
- Sidebar is drag-resizable (220 – 480 px)

---

## Photo Editor

- Upload any image as a profile photo
- Crop, zoom, and rotate with a full in-canvas photo editor
- Toggle photo visibility without removing it
- Photo shape follows the Style panel setting (circle / square / rounded)

---

## Export

- **Download PDF** — pixel-perfect US Letter PDF via browser print dialog
- **Export JSON backup** — portable full resume data file
- Import JSON backup — restore any previous resume
- Import `.docx` — auto-parsed into all resume fields via Mammoth.js + import quality score
- Import `.txt` — smart section detection and field mapping
- Import / Upload PDF — routes directly to the PDF Direct Editor

---

## PDF Direct Editor

A fully self-contained PDF text editor — no re-upload needed after editing.

### Rendering
- High-DPI canvas rendering — crisp at any device pixel ratio (Retina / 4K)
- Each page rendered to an offscreen canvas; shown as a background image so all graphics, logos, icons, dividers, and decorations are pixel-perfect
- Transparent text overlays sit on top — original PDF shows through unless a field is actively edited

### Text Editing
- Click any text element to edit inline
- Font size, font family (serif / sans-serif / monospace mapped from PDF), weight, and style are extracted from the PDF so edited text matches the original visually
- **Bold detection** — dual strategy: font-name pattern matching + canvas pixel-density sampling (catches embedded/subset fonts whose names don't contain "bold")
- White cover dynamically sized to the actual rendered CSS width (measured via `scrollWidth`) so neither the original nor the edited text bleeds through
- Editing box is unconstrained — no page-boundary clipping while typing
- Emoji / pictographic items are non-editable; the PDF canvas renders them faithfully
- Link annotations detected and shown as tooltips

### Edit Management
- Edited fields highlighted with a green outline; clean fields remain transparent
- Undo / Redo (Ctrl+Z / Ctrl+Y) — up to 50 steps
- Reset all edits in one click
- **Named snapshots** — save the current set of edits with a custom label; up to 20 snapshots per session; rename or delete from the sidebar
- Restore any snapshot to jump back to an earlier editing state

### Export
- **Fused PDF export** — builds a hidden print DOM: original canvas image as the base layer + white-cover + new-text divs only for edited items; `window.print()` produces a composited PDF
- Multi-page PDFs fully supported — each page breaks correctly in the output
- Zoom in / out (40 % – 200 %) for comfortable editing

---

## Home Page

- Animated interactive dots canvas on the hero background — dots drift continuously and repel from the cursor
- Template gallery with category filter (all / professional / creative / academic)
- Mini live-rendered previews for every template
- One-click import from the hero (PDF → PDF Editor; .docx/.txt → resume editor)

---

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v3
- Zustand — state management, undo/redo history, live (no-history) settings updates
- Framer Motion — animations
- @dnd-kit — drag and drop
- PDF.js (`pdfjs-dist`) — PDF parsing, canvas rendering, text + annotation extraction
- Mammoth — `.docx` parsing
- React Hot Toast — notifications
- React Router v7
- Lucide React — icons
- nanoid — collision-free IDs

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

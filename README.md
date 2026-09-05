# FreeCV

A resume builder that runs entirely in your browser. No account, no server, nothing uploaded. Your resume never leaves your machine.

Pick a template, click any text to edit it, download a PDF. That's the whole thing.

This started as a side project over a semester break and it's stayed one. It works, it's free, and it's open to contributions.

## What's in it

- **10 templates.** Awesome CV, Jake's, Deedy, Twenty Seconds, SB2Nov, Friggeri, Academic, Hipster, ModernCV, AltaCV. Switch anytime; your content carries over.
- **Click-to-edit preview.** No forms. You edit the resume itself and watch it update.
- **PDF editor.** Drop in an existing PDF and edit its text in place.
- **Import.** `.pdf`, `.docx`, or `.txt`. Export a JSON backup or a PDF at any time.
- **Local saves.** Autosave, named snapshots, version history, crash recovery, all in browser storage.

Desktop only for now: the editor asks for a screen wider than 1024px.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

`npm run build` produces the production bundle, `npm run lint` checks the code.

## Stack

React 19 · TypeScript · Vite · Tailwind · Zustand · PDF.js

## Layout

```
src/
  pages/        home, resume editor, PDF editor
  components/   editor UI, sidebar panels, resume templates
  store/        zustand stores: resume state, saves, PDF edits
  utils/        PDF export, file parsing, IndexedDB
  data/         default resume, template configs
```

## Contributing

FreeCV is taking part in **Hacktoberfest 2026**. Contributions are welcome, but please read [CONTRIBUTING.md](CONTRIBUTING.md) first. It sets out clear rules about which PRs get merged and which get closed.

## License

[GPL-3.0](LICENSE). You can use, modify, and share this freely. If you distribute a
modified version, it has to stay open source under the same license.

Resumes you build with FreeCV are yours. The license covers this code, not your data.

---

Built by [Adarsh Ranjan](https://github.com/Apex-05). Free forever.

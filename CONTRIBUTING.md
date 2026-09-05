# Contributing to FreeCV

Thanks for looking. FreeCV is a side project, so the bar for a PR is simple: **does it make the app do something better?**

Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

Found a security problem? Don't open an issue. See [SECURITY.md](SECURITY.md) instead.

## What gets merged

Anything that adds or improves real behaviour:

- A new resume template
- A new section type, or new fields on an existing one
- Better `.docx` / `.txt` / PDF parsing (the parser misses plenty)
- A real bug fix (describe the bug in the PR, or open an issue first)
- Accessibility: keyboard navigation, focus handling, screen-reader labels
- Performance work, with a before/after
- Mobile support (the editor currently refuses to load below 1024px)
- Fixing the React Hooks errors left in `npm run lint` (~33 of them, and each needs an actual refactor)

## What does not get merged

Please don't open a PR that only does one of these:

- Fixing typos or rewording the README and docs
- Adding, reformatting, or translating comments
- Changing colors, spacing, fonts, or other pure styling tweaks
- Renaming variables, reordering imports, reformatting files
- Adding a linter, formatter, or CI config nobody asked for
- Bumping dependencies with no reason given

These get closed. They don't help the project, and they aren't what Hacktoberfest is for.

## AI-written code

Use it. Claude, Copilot, Cursor, whatever you like. How the code got written doesn't matter here, only whether it's good. AI-assisted PRs are genuinely welcome.

Two conditions:

1. **It works.** `npm run build` and `npm run lint` should pass, and you should have actually clicked through the feature in a browser.
2. **It isn't bloat.** No 400-line abstraction for a 20-line problem. No new dependency for something the language already does. No defensive `try/catch` around code that can't throw. No comments restating the line below them.

If you can't explain in the PR description what your change does, it isn't ready yet.

## Branches

FreeCV uses two long-lived branches:

| Branch | Purpose | Contributor PRs |
|---|---|---|
| `dev` | Development branch where accepted contributions land first. | Yes |
| `main` | Stable release branch. Updated from `dev` through a PR. | No |

Contributors should open pull requests against `dev`, not `main`.

The `main` branch is protected and cannot be updated directly. Changes reach `main` through a reviewed `dev` → `main` pull request.

If you accidentally open a PR against `main`, please retarget it to `dev`.

## Sending a PR

Fork the repo first, since you won't have push access to this one.

```bash
git clone https://github.com/<your-username>/FreeCV.git
cd FreeCV
git checkout -b my-change dev
npm install
npm run dev
```

Then:

1. Make your change on your branch, not on `dev` or `main`.
2. Run `npm run build` and `npm run lint`. Both should pass.
3. Push to your fork and open the PR **against `dev`**, not `main`.
4. Say what it does and how you tested it.

Screenshots help a lot for anything visual.

## Licensing

FreeCV is [GPL-3.0](LICENSE). By opening a pull request you agree your contribution
is licensed under the same terms. Nothing to sign, no CLA.

## Questions

Open an issue. Happy to talk an idea through before you build it, especially for bigger features, so you don't spend a weekend on something I'd have to turn down.

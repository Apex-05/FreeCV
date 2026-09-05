# Security Policy

## The short version

FreeCV has no backend. There is no server, no database, no account system, and no
analytics. Your resume never leaves your browser, so there is no FreeCV server for
an attacker to breach and nothing of yours stored anywhere we control.

That makes the interesting attack surface small, but not empty. It is mostly about
what happens when the app parses a file you give it, or renders text that came from
somewhere other than your own keyboard.

## Supported versions

This is a side project, not a versioned release train. Only the current `main`
branch and the live deployment are supported. Fixes land on `main`; there are no
backports.

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Report it privately instead:

- Go to the repository's **Security** tab and choose **Report a vulnerability**.
  This opens a private thread visible only to maintainers.
- If that is unavailable, use GitHub's **Report abuse** link, which routes to
  GitHub Support.

Helpful things to include: what you did, what happened, what you expected, and a
proof of concept if you have one. A sample file that triggers the issue is worth a
lot for anything involving PDF, DOCX, TXT, or JSON parsing.

This is a side project maintained by one person in their spare time, so please
expect a first reply in days rather than hours. You will get one. If a report is
valid, credit in the fix commit is yours unless you would rather stay anonymous.

## In scope

- Cross-site scripting through resume content, especially the rich-text fields,
  which accept a small set of formatting tags
- Malicious input files that lead to code execution or data exfiltration when
  imported (`.pdf`, `.docx`, `.txt`, or a JSON backup)
- Anything that causes resume data to leave the browser
- Vulnerabilities in a dependency that are actually reachable from FreeCV's code
- Bypasses of the link handling that let a non `http(s)` scheme be opened

## Out of scope

- Anything requiring physical access to an unlocked machine. Resume data lives in
  `localStorage` and IndexedDB by design, and is readable by anyone who already
  controls the browser profile. That is the trade for having no server.
- Attacks that need the victim to paste attacker-supplied JavaScript into their
  own browser console
- Missing security headers or a missing Content Security Policy on the deployed
  site, unless you can show concrete impact
- Denial of service by feeding the parser an enormous file. It runs on your own
  machine and only your own tab suffers.
- Reports produced by running a scanner with no evidence the finding is reachable
- Vulnerabilities in a dependency that FreeCV does not actually exercise

## What the app already does

Useful context before you dig in:

- Rich-text fields run through an allowlist sanitizer that keeps only
  `b i u s sub sup strong em`, strips every attribute, and unwraps anything else.
  It runs on the way in and on the way out, so stored content is sanitized when it
  is rendered, not only when it is typed.
- Links are forced to `https://` unless they already start with `http(s)://`, and
  open with `noopener,noreferrer`.
- Link annotations extracted from an uploaded PDF are filtered to `http(s)` before
  being shown.
- PDF parsing runs in a Web Worker via PDF.js. DOCX parsing uses Mammoth.

If you find a hole in any of the above, that is exactly the kind of report worth
sending.

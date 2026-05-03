# SecureGen — Product Requirements

## Overview

SecureGen is a client-side password generator built for people who take security seriously. It generates cryptographically secure passwords and passphrases in the browser — no server, no telemetry, no storage unless the user opts in. The target user is anyone who wants a fast, trustworthy tool without signing up for anything.

---

## Current Feature Set (v1.0)

Already implemented and working:

| Feature | Notes |
|--------|-------|
| Cryptographically secure generation | Uses `crypto.getRandomValues` — not `Math.random` |
| Length control | Slider, 8–32 characters |
| Character type toggles | Special characters, capitals, numbers |
| 5-tier strength label | very weak → weak → average → good → very good |
| Clipboard copy | With success and error toast feedback |
| Dark / light / system theme | Via next-themes |
| Responsive layout | Down to mobile (475px breakpoint) |
| Stack | Next.js 16, React 19, TypeScript (strict), Tailwind CSS, shadcn/ui |

---

## Functional Requirements

### Priority levels
- **P1** — Core value. Do these first.
- **P2** — UX polish. Do these second.
- **P3** — Stretch goals. Nice to have.

---

### P1 — Core improvements

#### FR-01 · Visual strength meter (replaces text label)
Replace the current text-only strength tier with a visual strength bar backed by real scoring.

- Integrate `zxcvbn` (or `zxcvbn-ts`) to score passwords on a 0–4 scale
- Display a segmented progress bar colour-coded by score (red → amber → green)
- Show estimated crack time (e.g. "centuries", "3 hours", "instantly")
- Remove the current hand-rolled tier logic from `lib/generate-password.ts`

#### FR-02 · Exclude ambiguous characters
Add a toggle that removes characters that look similar in common fonts.

- Characters to exclude: `0`, `O`, `1`, `l`, `I`
- Toggle label: "Exclude ambiguous (0/O, 1/l/I)"
- Default: off

#### FR-03 · Passphrase mode
Add a mode that generates word-based passphrases in the style of `correct-horse-battery-staple`.

- Word source: EFF Long Wordlist (7,776 words, ~60 bits of entropy per word)
- Controls: word count (3–8), separator (hyphen, dot, underscore, space, none)
- Display estimated crack time via the same zxcvbn scorer
- Toggle between "Password" and "Passphrase" modes at the top of the card

#### FR-04 · Keyboard shortcut to regenerate
Allow power users to generate without reaching for the mouse.

- `Enter` or `Space` when no form control is focused → trigger generate
- `⌘G` / `Ctrl+G` → trigger generate regardless of focus
- Show the shortcut hint below the generate button

---

### P2 — UX polish

#### FR-05 · Generate multiple passwords at once
Show a batch of options instead of a single result, so users can pick a favourite.

- Default batch size: 5
- Each row: password text + copy icon button
- Clicking copy on a row copies that password and shows a brief inline confirmation
- "Regenerate all" button refreshes the entire batch

#### FR-06 · Password history
Keep a local record of recent generations for easy retrieval.

- Store the last 10 generated passwords in `localStorage`
- Display in a collapsible panel below the generator
- Each entry: masked password (reveal on hover/click), copy button, timestamp
- "Clear history" button wipes localStorage and the list
- No history stored by default — user must explicitly enable it (opt-in toggle)

#### FR-07 · Live composition stats
Show a summary of what the current password contains.

- Format: `16 chars · 3 symbols · 4 capitals · 4 numbers`
- Updates as the user changes length or toggles options
- Displayed below the password output, above the strength meter

---

### P3 — Stretch goals

#### FR-08 · Export / download
Let users save a batch of generated passwords to a file.

- Generate a configurable number of passwords (10, 25, 50)
- Download as plain `.txt`, one password per line
- No formatting, no metadata — just the passwords

#### FR-09 · HaveIBeenPwned breach check
Check whether a generated password has appeared in a known data breach.

- Use the HIBP Pwned Passwords API (k-anonymity model: only the first 5 hex chars of the SHA-1 hash are sent)
- Display a warning badge if the password is found in the dataset
- Display a green "Not found in known breaches" badge if clean
- Never send the full password or hash to any server

#### FR-10 · PWA / installable
Make SecureGen available offline and installable on desktop and mobile.

- Add `manifest.json` with icon set
- Add a service worker that caches the app shell
- Works fully offline (no network calls in the critical path)

---

## Non-Functional Requirements

### Security
- All password generation happens client-side. No generated password is ever transmitted to a server.
- The only permitted external network call is to the HIBP API (FR-09), using k-anonymity — the full password or its full hash is never sent.
- No third-party analytics or tracking scripts.

### Performance
- Lighthouse performance score ≥ 90 on mobile (3G throttling).
- Core JS bundle ≤ 150 kB gzipped (excluding the EFF word list, which may be lazy-loaded).
- No layout shift on initial load (CLS < 0.1).

### Accessibility
- WCAG 2.1 Level AA compliance.
- All form controls have associated labels (use `FormLabel` from shadcn/ui consistently).
- All interactive elements are keyboard-navigable with a visible focus ring.
- Password display is readable by screen readers (`aria-live` region for updates).
- Strength meter has an accessible text equivalent (not colour-only).

### Privacy
- No cookies, no analytics, no tracking.
- `localStorage` is used only for the opt-in history feature (FR-06).
- No user accounts, no sign-up.

### Browser support
- Last 2 major versions of Chrome, Firefox, Safari, Edge.
- `crypto.getRandomValues` and `localStorage` are the only browser APIs required.

---

## Technical Standards

### Testing
- **Framework**: Vitest + React Testing Library
- Unit tests required for all functions in `lib/` before modifying them
- Target: ≥ 80% line coverage on `lib/`
- Integration tests for the generator form (submit → password displayed → copy)

### CI / CD
- GitHub Actions pipeline on every pull request:
  - `npm run build` — must pass
  - `npm run lint` — must pass
  - `npm run test` — must pass (once tests exist)
- No PR merged with a failing pipeline

### Code style
- TypeScript strict mode, no `any`
- ESLint flat config (`eslint.config.mjs`) — no warnings suppressed with inline comments
- No commented-out code committed to `main`
- Conventional commit format: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`

### Dependency policy
- Prefer the Web Platform (Crypto API, localStorage, Fetch) over npm packages for security-critical paths
- New dependencies require justification (size, maintenance status, licence)
- Run `npm audit` before merging any dependency changes

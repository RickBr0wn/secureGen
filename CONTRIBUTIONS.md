# Contributing to SecureGen

Thanks for taking the time to contribute. This document covers everything you need to get started.

---

## Code of conduct

Be respectful and constructive. Harassment, discrimination, or personal attacks of any kind will not be tolerated.

---

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+

### Local setup

```bash
git clone https://github.com/RickBr0wn/secureGen.git
cd secureGen
npm install
npm run dev
```

Tests run with:

```bash
npm test
```

---

## How to contribute

### Reporting a bug

1. Search [existing issues](https://github.com/RickBr0wn/secureGen/issues) first.
2. If nothing matches, open a new issue and include:
   - A clear title and description
   - Steps to reproduce
   - Expected vs. actual behaviour
   - Browser and OS

### Suggesting a feature

Open an issue with the `enhancement` label. Describe the problem it solves, not just the solution, so we can discuss the best approach before work starts.

### Submitting a pull request

1. Fork the repository and create a branch from `master`:

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes. Keep commits focused — one logical change per commit.

3. Add or update tests as appropriate. All tests must pass:

   ```bash
   npm test
   ```

4. Make sure TypeScript compiles cleanly:

   ```bash
   npx tsc --noEmit
   ```

5. Push your branch and open a pull request against `master`. Fill in the PR template with what changed and why.

---

## Project structure

```text
app/                  # Next.js app router (page, layout, theme provider)
components/
  password-generator/ # Main generator UI and history panel
  ui/                 # shadcn/ui primitives (do not edit directly)
lib/                  # Pure functions and hooks — all unit tested
public/
  words.json          # Wordlist for passphrase generation
```

Key constraints:

- **`lib/` functions must be pure and side-effect-free** — they are unit tested in isolation.
- **`crypto.getRandomValues`** must be used for all randomness. `Math.random()` is not acceptable.
- **No passwords are transmitted to any server.** The HaveIBeenPwned check uses k-anonymity — only the first 5 hex characters of a SHA-1 hash are sent.

---

## Style guide

- TypeScript strict mode is enforced — no `any`.
- Tailwind utility classes for all styling; no inline styles.
- React Hook Form + Zod for all form state and validation.
- No comments that describe *what* the code does — only comments that explain a non-obvious *why*.
- Keep components small and single-purpose. Extract sub-components when a component grows beyond ~100 lines.

---

## Testing

Tests live in `lib/__tests__/` and use Vitest + Testing Library.

- Every function in `lib/` should have corresponding tests.
- Test behaviour, not implementation. Assert on outputs and side effects, not internal state.
- Do not mock `crypto` — the test environment provides the Web Crypto API.
- Use `renderHook` + `act` for testing custom hooks.

---

## Licence

By contributing you agree that your work will be released under the [MIT Licence](LICENCE.md).

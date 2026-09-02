# Quickstart and Validation: Single-Page Personal Site

**Date**: 2026-09-02

How to run this locally and how to prove each phase is done. Scenarios are runnable checks, not
implementation notes. Schema detail lives in [contracts/content-schema.md](./contracts/content-schema.md);
cutover detail in [contracts/deployment.md](./contracts/deployment.md).

---

## Prerequisites

- Node 22.16.0. `.nvmrc` pins it; `nvm use` picks it up.
- Nothing else. No global installs, no environment variables, no secrets.

## Setup and run

```bash
nvm use
npm ci
npm run dev        # local preview
npm run build      # produces dist/
npm run preview    # serve the built output
npm run check      # prettier --check, astro check, budgets
```

`npm ci` from a clean clone must succeed with no further setup. If it does not, Principle IV is
broken and that is the bug to fix first.

---

## Phase 1 validation

**Gate: SC-006, SC-007, SC-009.**

### V1.1 Build produces no JavaScript

```bash
npm run build && find dist -name '*.js' -o -name '*.mjs' | grep . && echo FAIL || echo PASS
```

Expected: `PASS`, no files listed. This is Principle II reduced to one command.

### V1.2 Budgets hold

```bash
node scripts/check-budgets.mjs
```

Expected: exit 0, with the measured HTML plus CSS total printed. Expected well under 20KB at this
phase.

### V1.3 One render-blocking request

Build, open `dist/index.html`, and confirm the stylesheet is a `<style>` block in `<head>` rather
than a `<link rel="stylesheet">`. Expected: no external CSS request.

### V1.4 A malformed edit fails the build

Delete the `name` line from `src/data/site.md`, then `npm run build`.

Expected: non-zero exit, with a message naming `name` as missing. Restore the line and confirm the
build passes. This is FR-013 and SC-008, and it is worth doing once by hand rather than trusting it.

### V1.5 The provisional page reads as deliberate

Open the built page. Expected: the name as the only `<h1>`, one line saying the site is being
rebuilt, no stand-in photograph, no placeholder text posing as a bio. A visitor should read it as
unfinished on purpose, not broken or abandoned (FR-021).

### V1.6 Degradation

With the page open: block images, then disable CSS, then disable JavaScript, one at a time.

Expected: readable and complete in all three states, with content in a sensible order when unstyled
(FR-005, SC-009).

### V1.7 Theming without JavaScript

Switch the operating system between light and dark appearance and reload.

Expected: both legible, neither a degraded version of the other, no flash on load, and no
JavaScript involved (FR-007). Then confirm the fallback: colours must still be legible if
`light-dark()` is unsupported, which the duplicate token declaration provides.

### V1.8 Addressing, after the cutover

```bash
curl -sSI https://joeburkinshaw.com | head -1
curl -sSI http://joeburkinshaw.com | head -1
curl -sSI https://www.joeburkinshaw.com | head -1
curl -sSI https://jburkinshaw.github.io | head -1
```

Expected: all four reach the new page, secure, with no certificate warning (SC-006). Run this only
after all three cutover steps and after Enforce HTTPS is on. Certificate provisioning can take up to
24 hours, and a failure inside that window is expected rather than a defect.

### V1.9 No third-party requests

Load the page with the browser network panel open.

Expected: every request is to `joeburkinshaw.com`. Zero third-party origins, therefore no consent
notice needed (FR-010, SC-007).

---

## Phase 2 validation

**Gate: SC-002, SC-005, and the byte budgets.**

- **V2.1** Measure at 320px and at a wide desktop width. No horizontal scrolling, and no line of
  body text beyond roughly 75 characters (FR-008).
- **V2.2** Traverse the whole page with the keyboard alone. Every interactive element reachable, with
  a clearly visible focus indicator (FR-006).
- **V2.3** Run a Lighthouse mobile audit. Accessibility, Best Practices and SEO at 100; Performance
  at 95 or above. Record the scores in the task list, since this is the manual half of Principle VII.
- **V2.4** Check every colour pairing for WCAG AA: 4.5:1 for body text, 3:1 for large text, in both
  appearances.
- **V2.5** Confirm no raw colour, size or spacing literal appears in any component style block. Every
  value comes from a token (Principle VI).
- **V2.6** Confirm the composition against Principle VI by inspection: no shadows, no gradients, no
  border radius, no decorative icons, no motion beyond link and focus transitions under 150ms, and
  `prefers-reduced-motion` honoured.

---

## Phase 3 validation

**Gate: SC-001, SC-003, SC-004, SC-010.**

- **V3.1** Show the page to five people who have not met Joe. All five can state his profession and
  location after ten seconds (SC-001).
- **V3.2** From a phone browser only, with no development tools, change one sentence of the bio and
  confirm it is live within five minutes (SC-003). This is the whole point of the rebuild, so it is
  worth actually doing rather than assuming.
- **V3.3** Follow every displayed link. All reach a live destination belonging to Joe (SC-004,
  FR-020).
- **V3.4** Confirm `provisional` is removed from the content file, not merely set false.
- **V3.5** Confirm the photograph is under 150KB and total page weight under 250KB, via
  `check-budgets.mjs`.
- **V3.6** Confirm the alternative text describes the image rather than repeating the name (FR-002).
- **V3.7** Read the README. Changing the bio, swapping the photograph and adding a link must each be
  findable in under twenty lines (FR-015).

# Implementation Plan: Single-Page Personal Site

**Branch**: `001-single-page-site` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-single-page-site/spec.md`

## Summary

Deliver User Story 2 first. Retire the 2021 Jekyll site, repair the broken secure address, and put a
deliberately provisional page live at `https://joeburkinshaw.com`, before any real copy or the
photograph exists. Real content and the final composition follow in later phases.

The approach: a bare Astro `minimal` scaffold producing one static page with zero client JavaScript,
deployed by `withastro/action` on push to `main`. Content is separated from presentation from the
first commit, as frontmatter in a single Markdown file validated at build time by the Zod that Astro
already bundles, so later phases are content edits rather than refactors. The design system ships as
a token sheet in Phase 1 with composition deferred to Phase 2. The domain cutover is three ordered
manual steps that only the owner can perform.

**Phasing**, with every task in `tasks.md` to carry its phase marker:

| Phase | Deliverable | Acceptance |
|---|---|---|
| **P1** | Scaffold, token sheet, provisional page, CI deploy, domain cutover | SC-006, SC-007, SC-009 |
| **P2** | Final composition, photograph pipeline, budget enforcement | SC-002, SC-005, and the byte budgets |
| **P3** | Real bio, real photograph, verified links | SC-001, SC-003, SC-004, SC-010 |

## Technical Context

**Language/Version**: TypeScript 5.x in `strict` mode, supplied by Astro. Node 22.16.0 locally and
pinned identically in CI. Astro 7.2.10 declares `engines.node >=22.12.0`, which 22.16.0 satisfies.

**Primary Dependencies**: `astro@7.2.10` as the only production dependency. Four dev dependencies,
each justified in `research.md`: `@astrojs/check` and `typescript`, which `astro check` requires and
which `astro` does not bundle, plus `prettier` and `prettier-plugin-astro`. Zod arrives via
`astro/zod`, a re-export of the `zod@^4.3.6` that Astro already depends on, so it needs no install
and cannot skew from Astro's own copy.

**Storage**: None. All content is two files in the repository: frontmatter in `src/data/site.md`
and, from Phase 3, one image in `src/assets/`. No database, no API, no runtime data fetching.

**Testing**: No unit test framework, and none is warranted. A single static page has no units to
test in isolation. Correctness is enforced at build time instead, by three mechanisms: `astro check`
for types and template diagnostics, an `astro/zod` schema parse that fails the build on malformed
content, and a dependency-free byte-budget check over `dist/` in CI. Behavioural verification is the
manual checklist in `quickstart.md`.

**Target Platform**: Static HTML served from the GitHub Pages CDN. Current versions of the major
desktop and mobile browsers, per the spec's assumptions.

**Project Type**: Static site. One page, no routing, no server.

**Performance Goals**: Text readable within 1s and the page complete within 3s on a typical mobile
connection (SC-002). Exactly one render-blocking request, achieved with `build.inlineStylesheets:
'always'`. Zero bytes of client JavaScript.

**Constraints**: HTML plus all CSS under 20KB uncompressed. Photograph under 150KB, total page
weight under 250KB. Lighthouse mobile 100 for Accessibility, Best Practices and SEO with a
Performance floor of 95. Zero requests to third-party origins. WCAG AA contrast. Usable from 320px
upward. Readable with images blocked, styling disabled, and scripting disabled. Budgets may tighten
but not loosen without a constitution amendment.

**Scale/Scope**: One page, one profile, approximately two external links, one image. No growth is
anticipated within this feature.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Verdict |
|---|---|---|
| I. Simplicity Is The Requirement | No content collections, no dynamic routes, no abstraction with a single caller, no schema for content that does not exist | **PASS.** Collections and routing are excluded from all three phases. `src/lib/site.ts` has one caller but is data loading rather than abstraction, and exists because FR-011 requires the separation. The Phase 3 schema covers only fields that will actually be populated. |
| II. Zero JavaScript By Default | 0 bytes shipped; no third-party origins | **PASS.** No islands, no `client:` directives, no inline script. Theming is `prefers-color-scheme` and `light-dark()` with no toggle. All assets are self-hosted, so FR-010 holds and no consent notice is needed. |
| III. Platform Over Packages | Production dependencies empty beyond `astro`; every dev dependency justified | **PASS with a recorded departure.** Two dev dependencies are justified in `research.md`. ESLint is deliberately omitted; see Complexity Tracking. |
| IV. Publish By Push | One push publishes; clean-clone buildable; failing build blocks deploy; manual steps recorded as owner tasks | **PASS.** `npm ci && npm run build` from a clean clone, no secrets. The workflow's build step gates the deploy step. The three cutover steps are one-time infrastructure, explicitly recorded as owner tasks per this principle's own clause rather than hidden. |
| V. Content Is Editable Without Reading Code | Content in data or Markdown with typed frontmatter; browser-editable; malformed edit fails the build | **PASS.** One Markdown file, frontmatter only, no code. `safeParse` failure exits non-zero with the offending field named, satisfying FR-013. Adding a link is one list entry, satisfying FR-012. |
| VI. Restraint Is The Design | Tokens only, near-monochrome, no ornament, reduced-motion honoured | **PARTIAL BY DESIGN.** Phase 1 ships the token sheet; composition is Phase 2, so this principle is only fully assessable at Phase 2 exit. Phase 1's provisional page is still bound by it: no ornament, no motion, tokens only. |
| VII. Quality Is Measured, Not Asserted | Numeric budgets, accessibility floor, type and build gate, all CI-enforced | **PASS with a recorded departure.** Byte budgets and the type and build gates run in CI from Phase 1. Lighthouse is not automated; see Complexity Tracking. |

**Post-design re-check (after Phase 1 artifacts):** no verdict changed. The design added no
dependency, no client JavaScript, and no abstraction beyond the single data module already accounted
for above.

## Project Structure

### Documentation (this feature)

```text
specs/001-single-page-site/
├── plan.md                      # This file
├── spec.md                      # Feature specification
├── research.md                  # Phase 0 output
├── data-model.md                # Phase 1 output
├── quickstart.md                # Phase 1 output
├── contracts/
│   ├── content-schema.md        # Owner-facing content contract
│   └── deployment.md            # Repository and DNS contract
├── checklists/
│   └── requirements.md          # Spec quality checklist
└── tasks.md                     # Created by /speckit-tasks, not here
```

### Source Code (repository root)

```text
astro.config.mjs                 # P1  site, no base, inlineStylesheets: 'always'
package.json                     # P1  astro only in dependencies
tsconfig.json                    # P1  extends astro/tsconfigs/strict
.nvmrc                           # P1  22.16.0, single source of truth for Node
.prettierrc                      # P1  with prettier-plugin-astro
.gitignore                       # exists

public/
├── CNAME                        # P1  joeburkinshaw.com
└── favicon.svg                  # P1

src/
├── data/
│   └── site.md                  # P1  the only file the owner edits
├── lib/
│   └── site.ts                  # P1  imports site.md, validates via astro/zod
├── layouts/
│   └── Base.astro               # P1  html shell, meta, canonical, OG, Twitter card
├── pages/
│   └── index.astro              # P1  provisional; P2 final composition
├── styles/
│   └── global.css               # P1  reset plus the full token set
└── assets/
    └── joe.jpg                  # P3  photograph, via astro:assets

scripts/
└── check-budgets.mjs            # P1  node builtins only, no dependency

.github/workflows/
└── deploy.yml                   # P1  two jobs: build then deploy-pages

README.md                        # P1  under 20 lines
```

**Structure Decision**: Flat single-project layout, which is the Astro convention and the smallest
thing that works. Content lives at `src/data/site.md`, deliberately not under `src/content/`, to
keep it unambiguously outside content-collection territory; it is a plain Markdown import, chosen so
the owner edits frontmatter rather than code. `src/lib/site.ts` is the only indirection in the tree and exists solely to make the malformed
edit in FR-013 fail loudly at build time. No `tests/` directory, for the reason given under Testing.

## Complexity Tracking

> Two deliberate departures from the constitution, recorded per its Governance clause.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| ESLint omitted, despite the constitution's Development Workflow naming "lint" as a blocking check | The lintable surface is close to empty. There is zero client JavaScript, one page, and `strict` TypeScript. `astro check` already reports unused variables, unreachable code, type errors and template diagnostics, which is most of what a flat ESLint config would catch here. Adding ESLint means four dev dependencies and a config to maintain for near-zero marginal signal, which is exactly what Principle III exists to prevent. | Adding ESLint was rejected as cost without benefit at this scale. **To remove this exception:** add ESLint the moment any client-side JavaScript is introduced under Principle II's exception process, or when a second contributor joins and shared conventions stop being implicit. |
| Lighthouse budgets not enforced in CI, despite Principle VII requiring gates be "enforced by CI rather than remembered" | Automating Lighthouse means a headless Chrome download on every run and a heavy dev dependency, to audit a single static page. The numeric parts that actually regress silently, being JavaScript bytes and CSS weight, are enforced from Phase 1 by `scripts/check-budgets.mjs` using Node builtins only. Lighthouse is run manually at Phase 2 and Phase 3 exit and the scores recorded in the task list. | A CI Lighthouse run was rejected on dependency cost. Fully manual verification was also rejected, because the byte budgets are precisely the thing a human forgets. **To remove this exception:** automate Lighthouse when the site grows past one page, or if a manual audit ever finds a regression the byte check missed. |

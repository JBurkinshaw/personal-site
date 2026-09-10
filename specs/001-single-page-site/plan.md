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
a token sheet in Stage 1 with composition deferred to Stage 2. The domain cutover is three ordered
manual steps that only the owner can perform.

**Build stages**, with every task in `tasks.md` carrying its stage marker. "Stage" is deliberately
distinct from two other numbered things in this project: Spec Kit's own Phase 0 and Phase 1 planning
phases, and the task phases in `tasks.md`. Story priorities in `spec.md` remain `P1` to `P4` and are
unrelated to stages.

| Stage | Deliverable | Acceptance |
|---|---|---|
| **S1** | Scaffold, token sheet, provisional page, CI deploy with budget enforcement, domain cutover | SC-006, SC-007, SC-009 |
| **S2** | Final composition and photograph pipeline | SC-002, SC-005, and the byte budgets |
| **S3** | Real bio, real photograph, verified links | SC-001, SC-003, SC-004, SC-010 |

## Technical Context

**Language/Version**: TypeScript 5.x in `strict` mode, supplied by Astro. Node 22.16.0 locally and
pinned identically in CI. Astro 7.2.10 declares `engines.node >=22.12.0`, which 22.16.0 satisfies.

**Primary Dependencies**: `astro@7.2.10` as the only production dependency. Four dev dependencies,
each justified in `research.md`: `@astrojs/check` and `typescript`, which `astro check` requires and
which `astro` does not bundle, plus `prettier` and `prettier-plugin-astro`. Zod arrives via
`astro/zod`, a re-export of the `zod@^4.3.6` that Astro already depends on, so it needs no install
and cannot skew from Astro's own copy.

**Storage**: None. All content is two files in the repository: frontmatter in `src/data/site.md`
and, from Stage 3, one image in `src/assets/`. No database, no API, no runtime data fetching.

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
| I. Simplicity Is The Requirement | No content collections, no dynamic routes, no abstraction with a single caller, no schema for content that does not exist | **PASS.** Collections and routing are excluded from all three phases. `src/lib/site.ts` has one caller but is data loading rather than abstraction, and exists because FR-011 requires the separation. The Stage 3 schema covers only fields that will actually be populated. |
| II. Zero JavaScript By Default | 0 bytes shipped; no third-party origins | **PASS.** No islands, no `client:` directives, no inline script. Theming is `prefers-color-scheme` and `light-dark()` with no toggle. All assets are self-hosted, so FR-010 holds and no consent notice is needed. |
| III. Platform Over Packages | Production dependencies empty beyond `astro`; every dev dependency justified | **PASS.** Four dev dependencies, each justified in `research.md` section 5. No dedicated linter, which constitution v1.0.1 permits provided the decision is recorded; research.md section 5 records it. |
| IV. Publish By Push | One push publishes; clean-clone buildable; failing build blocks deploy; manual steps recorded as owner tasks | **PASS.** `npm ci && npm run build` from a clean clone, no secrets. The workflow's build step gates the deploy step. The three cutover steps are one-time infrastructure, explicitly recorded as owner tasks per this principle's own clause rather than hidden. |
| V. Content Is Editable Without Reading Code | Content in data or Markdown with typed frontmatter; browser-editable; malformed edit fails the build | **PASS.** One Markdown file, frontmatter only, no code. `safeParse` failure exits non-zero with the offending field named, satisfying FR-013. Adding a link is one list entry, satisfying FR-012. |
| VI. Restraint Is The Design | Tokens only, at most six colour tokens with any beyond three carrying stated structural meaning, primitives as structure, marks only where functional, reduced-motion honoured | **PASS** against constitution v1.1.0. Built CSS contains zero box-shadow, border-radius, gradient, filter or animation declarations. One typeface via the system stack, two weights, four sizes, four colour tokens plus a rule derived from ink. Four colour tokens, two fewer than permitted: red is the bar and the square, blue is the circle and the map pin, and both meanings are recorded on the token. A fifth, a secondary grey, was declared and then removed once an audit found nothing rendered it. Worst text contrast 15.97:1 against a 4.5:1 floor, worst graphic 4.74:1 against 3:1, in both appearances. One typeface, Jost\*, self-hosted, with CLS measured at 0. The pin is the only mark and it earns its place by signalling that one link opens a map rather than a profile. The only motion is a 120ms link colour transition, switched off under `prefers-reduced-motion`. The single raw value in any component is the 48rem media query breakpoint, which CSS gives no way to tokenise. |
| VII. Quality Is Measured, Not Asserted | Numeric budgets, accessibility floor, type and build gate, all CI-enforced | **PASS with a recorded departure.** Byte budgets and the type and build gates run in CI from Stage 1. Lighthouse is not automated; see Complexity Tracking. |

**Post-design re-check (after Phase 1 artifacts):** no verdict changed. The design added no
dependency, no client JavaScript, and no abstraction beyond the single data module already accounted
for above.

**Post-implementation re-check (2026-09-09, all four user stories complete):** verified against the
built output rather than the source. Principle VI moved from PARTIAL to PASS. Principle I holds:
still one page, no collections, no dynamic routes, and the unused `Props` interface that had crept
into the layout was removed as structure ahead of a second use case. Principle II holds at zero
JavaScript files emitted, and the third-party check was corrected after it wrongly flagged outbound
`<a href>` links, which fetch nothing until clicked. Principle III holds with `astro` the only
production dependency. Principles IV and V hold, both exercised for real: a browser-only content
edit reached the live site, and a malformed edit failed CI with the deploy job skipped rather than
merely failed, leaving the live page byte-identical. Principle VII holds, with the one departure
below and with two measurement bugs fixed in `scripts/check-budgets.mjs` rather than worked around.

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
astro.config.mjs                 # S1  site, no base, inlineStylesheets: 'always'
package.json                     # S1  astro only in dependencies
tsconfig.json                    # S1  extends astro/tsconfigs/strict
.nvmrc                           # S1  22.16.0, single source of truth for Node
.prettierrc                      # S1  with prettier-plugin-astro
.gitignore                       # exists

public/
├── CNAME                        # S1  joeburkinshaw.com
└── favicon.svg                  # S1

src/
├── data/
│   └── site.md                  # S1  the only file the owner edits
├── lib/
│   └── site.ts                  # S1  imports site.md, validates via astro/zod
├── layouts/
│   └── Base.astro               # S1  html shell, meta, canonical, OG, Twitter card
├── pages/
│   └── index.astro              # S1  provisional; S2 final composition
├── styles/
│   └── global.css               # S1  reset plus the full token set
└── assets/
    └── joe.jpg                  # S3  photograph, via astro:assets

scripts/
└── check-budgets.mjs            # S1  node builtins only, no dependency

.github/workflows/
└── deploy.yml                   # S1  two jobs: build then deploy-pages

README.md                        # S1  under 20 lines
```

**Structure Decision**: Flat single-project layout, which is the Astro convention and the smallest
thing that works. Content lives at `src/data/site.md`, deliberately not under `src/content/`, to
keep it unambiguously outside content-collection territory; it is a plain Markdown import, chosen so
the owner edits frontmatter rather than code. `src/lib/site.ts` is the only indirection in the tree and exists solely to make the malformed
edit in FR-013 fail loudly at build time. No `tests/` directory, for the reason given under Testing.

## Complexity Tracking

> One deliberate departure from the constitution, recorded per its Governance clause.
>
> A second entry, the omission of ESLint, was removed when constitution v1.0.1 amended the
> Development Workflow to require type check, build and format rather than naming lint as a
> mandatory gate. It is no longer a departure. The reasoning is retained in research.md section 5,
> which is where the amendment requires the linter decision to be recorded.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Lighthouse budgets not enforced in CI, despite Principle VII requiring gates be "enforced by CI rather than remembered" | Automating Lighthouse means a headless Chrome download on every run and a heavy dev dependency, to audit a single static page. The numeric parts that actually regress silently, being JavaScript bytes and CSS weight, are enforced from Stage 1 by `scripts/check-budgets.mjs` using Node builtins only. Lighthouse is run manually at Stage 2 and Stage 3 exit and the scores recorded in the task list. | A CI Lighthouse run was rejected on dependency cost. Fully manual verification was also rejected, because the byte budgets are precisely the thing a human forgets. **To remove this exception:** automate Lighthouse when the site grows past one page, or if a manual audit ever finds a regression the byte check missed. |

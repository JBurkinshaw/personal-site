# Tasks: Single-Page Personal Site

**Input**: Design documents from `/specs/001-single-page-site/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No test tasks. The spec requests none and plan.md records why: a single static page has no
units to test in isolation. Correctness is enforced at build time by `astro check`, an `astro/zod`
schema parse, and a byte-budget script, all three blocking in CI.

**Organization**: Grouped by user story. **Story phases run in delivery order, not spec priority
order.** plan.md deliberately inverts them: US2 ships first so the 2021 site is retired and the
broken secure address repaired before any real copy exists. US1 is still the highest-value story and
remains the reason the site exists; it simply lands later because it depends on content the owner has
not written yet.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete work)
- **[Story]**: US1, US2, US3, US4 per spec.md
- **OWNER**: requires account access no agent has. Cannot be automated.

## Three numbered things, kept distinct

- **Phase 1 to 7**: the task phases in this file. They are the execution order.
- **Stage S1 to S3**: the build stages defined in plan.md. S1 is scaffold, tokens, provisional page
  and cutover; S2 is composition; S3 is real content. Each story header names its stage.
- **Priority P1 to P4**: story priority from spec.md, where P1 is US1. Priority is not delivery
  order, which is why the story phases below run US2 first.

## Path Conventions

Single project, flat, at repository root per plan.md. Source in `src/`, no `tests/` directory.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold and toolchain. Nothing here is visible to a visitor.

- [X] T001 Scaffold the bare Astro `minimal` starter into the repository root with `npm create astro@latest . -- --template minimal --no-git --skip-houston`, accepting the prompt warning that the directory is not empty, then confirm `.gitignore`, `PROJECT-BRIEF.md`, `.specify/` and `specs/` all survived unmodified
- [X] T002 Create `.nvmrc` containing `22.16.0` as the single source of truth for the Node version, matched by CI
- [X] T003 Set `package.json` scripts: `dev`, `build` (`astro build`), `build:ci` (`prettier --check . && astro check && astro build && node scripts/check-budgets.mjs`), `check` (`prettier --check . && astro check`, no build and no budgets, so it runs on a clean tree), `budgets` (`node scripts/check-budgets.mjs`, requires a prior build), and `preview`
- [X] T004 Point `tsconfig.json` at `astro/tsconfigs/strict` per plan.md's strict-mode requirement
- [X] T005 [P] Add dev dependencies `@astrojs/check` and `typescript`, both required by `astro check` and neither bundled with `astro`, per research.md section 5
- [X] T006 [P] Add dev dependencies `prettier` and `prettier-plugin-astro`, and create `.prettierrc` registering the plugin
- [X] T007 [P] Create `.prettierignore` excluding `dist/`, `.astro/`, `node_modules/` and `specs/`, so the format gate does not reformat the design documents' hand-aligned tables
- [X] T008 Configure `astro.config.mjs` with `site: 'https://joeburkinshaw.com'`, no `base` key, and `build.inlineStylesheets: 'always'` per research.md section 3
- [X] T009 Verify `package.json` `dependencies` contains `astro` and nothing else, and that the four dev dependencies above are the only entries in `devDependencies` (Principle III)

**Checkpoint**: `npm ci && npm run build` succeeds from a clean clone with no secrets.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The design token sheet, the content pipeline, the page shell, and the CI gates. Every
user story depends on all of it.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T010 Create `src/styles/global.css` with a minimal reset and `color-scheme: light dark` on `:root`
- [X] T011 Add the colour tokens to `src/styles/global.css` as four values only (ink, paper, mid-grey secondary, one accent), each declared **twice**: a plain light-mode value first, then the same custom property redeclared with `light-dark()`, per research.md section 2. Verify WCAG AA contrast for both appearances at this point, not later
- [X] T012 Add the spacing scale and the type scale to `src/styles/global.css`, both derived from a single base unit, at most four sizes and two weights, using a system font stack with no `@font-face` and no network request (Principle VI)
- [X] T013 [P] Create `src/data/site.md` with the Stage 1 frontmatter shape from contracts/content-schema.md: `name`, `title`, `description`, `provisional: true`, and an empty body. Note the path is `src/data/`, deliberately not `src/content/`, to stay clear of content-collection conventions
- [X] T014 Create `src/lib/site.ts` importing `src/data/site.md` as a plain Markdown module, importing `z` from `astro/zod`, and defining the Stage 1 schema: non-empty trimmed `name`, `title`, `description` at most 160 characters, optional boolean `provisional`. Include only fields that exist at this stage (Principle I)
- [X] T015 In `src/lib/site.ts`, run `safeParse` at module scope and `throw` on failure with a message naming the offending field and what was expected, so the failure surfaces during `astro build` and satisfies FR-013. Export the parsed result as separately typed `profile` and `metadata` values per data-model.md
- [X] T016 [P] Create `public/favicon.svg`, monochrome and consistent with the token palette
- [X] T017 Create `src/layouts/Base.astro` with the html shell, `lang`, viewport, a `<title>` and meta description from `metadata`, a canonical URL derived from `Astro.site` rather than hand-written, Open Graph and Twitter card tags, the favicon link, and a `global.css` import. No client-side script of any kind
- [X] T018 [P] Create `scripts/check-budgets.mjs` using Node builtins only. It must walk `dist/` and exit non-zero if any `.js` or `.mjs` file is emitted, if HTML plus CSS exceeds 20KB uncompressed, if any single image exceeds 150KB, or if total output exceeds 250KB. Print the measured totals on success so the numbers are visible in CI logs
- [X] T019 Create `.github/workflows/deploy.yml` with the two-job shape from contracts/deployment.md: a `build` job running `actions/checkout@v7` then `withastro/action@v6` with `node-version: 22.16.0` and `build-cmd: npm run build:ci`, and a separate `deploy` job with `needs: build` running `actions/deploy-pages@v5` with `id: deployment`. `withastro/action` only uploads a Pages artifact; it does not deploy
- [X] T020 Add to `.github/workflows/deploy.yml` the `permissions` block (`contents: read`, `pages: write`, `id-token: write`), the `github-pages` environment on the deploy job, a `concurrency` group of `pages` with `cancel-in-progress: false`, and triggers on push to `main` plus `workflow_dispatch`. Guard the deploy job with `if: github.ref == 'refs/heads/main'` so a `workflow_dispatch` against any other branch runs the gates but cannot publish
- [X] T021 Confirm the built output contains zero JavaScript and exactly one render-blocking request, by running `npm run build` and checking that `dist/index.html` carries an inline `<style>` block rather than a `<link rel="stylesheet">` (quickstart V1.1, V1.3)

**Checkpoint**: The build is green, gated, and deployable. Tokens exist. Content is validated. No
user story has shipped yet.

---

## Phase 3: User Story 2 - Visitor reaches the site reliably (Priority: P2, build stage S1) 🎯 MVP

**Goal**: Retire the 2021 site and serve a deliberately provisional page at
`https://joeburkinshaw.com` over HTTPS, with every form of the address arriving at the same place.

**Independent Test**: From a cold browser, request the secure address, the insecure address, the
`www` form. All three reach the new page with a valid certificate and no warning.

### Implementation

- [X] T022 [US2] Create `src/pages/index.astro` using `Base.astro`, rendering `profile.name` as the single `<h1>` and one line stating the site is being rebuilt. No stand-in photograph, no placeholder prose posing as a bio, no ornament. Values come from tokens only (FR-021, Principle VI)
- [X] T023 [P] [US2] Create `public/CNAME` containing exactly `joeburkinshaw.com` with no scheme, no trailing slash and a single trailing newline
- [X] T024 [US2] Push to `main` and confirm the workflow runs both jobs, that all four gates pass, and that the artifact deploys with no manual build or upload step (FR-014). Confirm the site is live at `jburkinshaw.github.io` before touching DNS, so the cutover is not pointing a domain at a broken build

### Cutover: OWNER, manual, strictly in this order

The order is a hard dependency. Full detail in contracts/deployment.md.

- [X] T025 [US2] **OWNER** Delete the `CNAME` file from `JBurkinshaw/jburkinshaw.github.io`, then archive that repository, per contracts/deployment.md Step 1. This must happen before T027, because GitHub scopes a custom domain to one repository and will reject the domain here while that file exists. **This has no undo: it retires the 2021 site permanently**
- [X] T026 [US2] **OWNER** At Hover, on the `joeburkinshaw.com` zone, per contracts/deployment.md Step 2: delete apex A records `192.30.252.153` and `192.30.252.154`, **delete the existing `www` A record `192.30.252.154`**, add apex A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`, then add a `www` CNAME to `jburkinshaw.github.io`. The `www` A record must go first: DNS forbids a CNAME coexisting with an A record at the same name
- [ ] T027 [US2] **OWNER** In this repository's settings, per contracts/deployment.md Step 3: set Pages source to **GitHub Actions**, set the custom domain to `joeburkinshaw.com`, wait for certificate provisioning, then enable **Enforce HTTPS**. Provisioning can take up to 24 hours and a failure inside that window is expected, not a defect
- [X] T028 [US2] Verify propagation with `dig +short joeburkinshaw.com A` returning only the four `185.199.10x.153` addresses, and `dig +short www.joeburkinshaw.com` resolving through the CNAME

### Verification

- [ ] T029 [P] [US2] Run quickstart V1.8: the secure address serves with a valid certificate (FR-016), the insecure and `www` forms both arrive at the canonical secure address (FR-017), and `jburkinshaw.github.io/personal-site/` forwards to the new page (FR-018). No warning on any of them (SC-006). The bare `jburkinshaw.github.io` returns 404 by decision and is not checked
- [ ] T030 [P] [US2] Run quickstart V1.9 with the browser network panel open: every request goes to `joeburkinshaw.com`, zero third-party origins, therefore no consent notice needed (FR-010, SC-007)
- [ ] T031 [P] [US2] Run quickstart V1.6: the page stays readable and complete with images blocked, with CSS disabled, and with JavaScript disabled (FR-005, SC-009)
- [ ] T032 [P] [US2] Run quickstart V1.7: legible in both light and dark with no flash and no JavaScript, and legible if `light-dark()` is unsupported, which the duplicate token declaration provides (FR-007)
- [ ] T033 [P] [US2] Run quickstart V1.5: a visitor reads the page as deliberately unfinished rather than broken or abandoned (FR-021)
- [ ] T034 [US2] Paste the address into a messaging app and a social composer, and confirm the tags emitted by `src/layouts/Base.astro` produce a title and description preview rather than a bare URL (FR-009)

**Checkpoint**: US2 complete. The old site is gone, HTTPS works, and the acceptance gate SC-006,
SC-007 and SC-009 is met. This is a shippable increment.

---

## Phase 4: User Story 3 - Owner updates content from a browser (Priority: P3, build stage S1)

**Goal**: Prove the content pipeline is genuinely usable by someone with no toolchain, before any
real content depends on it.

**Independent Test**: From a phone browser only, with no development tools, change one field in
`src/data/site.md` and confirm it is live without any further action.

### Implementation

- [ ] T035 [US3] Write `README.md` in under twenty lines covering how to change the bio, swap the photograph, and add a link, referencing `src/data/site.md` as the only file to edit (FR-015)
- [ ] T036 [US3] Run quickstart V1.4 by hand: delete the `name` line from `src/data/site.md`, run `npm run build`, and confirm a non-zero exit naming `name` as missing. Restore it and confirm the build passes (FR-013, SC-008)
- [ ] T037 [US3] Commit the malformed `src/data/site.md` from T036 to a throwaway branch, then trigger the workflow against it with `gh workflow run deploy.yml --ref <branch>`, which the `workflow_dispatch` trigger in `.github/workflows/deploy.yml` already permits. Confirm the build job fails at the schema parse, the deploy job is skipped rather than run, and the live page is unchanged. Delete the branch afterwards (FR-013, SC-008)
- [ ] T038 [US3] From a phone browser, edit `description` in `src/data/site.md` via the GitHub web editor, commit to `main`, and confirm the change is live within five minutes with no manual step anywhere in the chain (SC-003, FR-011, FR-014)

**Checkpoint**: US2 and US3 both work independently. The site is live and casually editable.

---

## Phase 5: User Story 1 - Visitor finds out who Joe is (Priority: P1, build stages S2 and S3)

**Goal**: The highest-value story. Real content and the final composition, so a stranger learns who
Joe is in ten seconds.

**Independent Test**: A reader who has never met Joe states his profession and location from what is
on screen, with no interaction beyond arriving.

**Blocked on the owner** for bio copy and a photograph. Everything before T041 can proceed without
them.

### Composition

- [ ] T039 [US1] Build the final composition in `src/pages/index.astro` and its scoped `<style>` block: one column, a 60 to 75 character measure, asymmetric rather than centred, all spacing from the Stage 1 token scale built in T012. Hairline rules rather than boxes, zero border radius, no shadows, no gradients (Principle VI)
- [ ] T040 [US1] Extend the schema in `src/lib/site.ts` to require `role`, `location`, `photo` and `photoAlt`, require `photoAlt` to differ from `name`, and treat the Markdown body as the bio. Remove `provisional` from the schema entirely rather than defaulting it false, per data-model.md's one-way state transition

### Content, OWNER-dependent

- [ ] T041 [US1] **OWNER** Supply the photograph and the final bio copy. The old site's description is a starting point, with its "enthsiast" typo corrected
- [ ] T042 [US1] Add the photograph to `src/assets/` and render it through `astro:assets` as `<picture>` with WebP plus a raster fallback and intrinsic dimensions so it reserves its own space and causes no layout shift (FR-002)
- [ ] T043 [US1] Populate `src/data/site.md` with `role`, `location`, `photo`, `photoAlt` and the bio body, and remove the `provisional` key (FR-003, FR-021)
- [ ] T044 [US1] Add a share-preview image and wire it into `Base.astro`'s Open Graph and Twitter card tags (FR-009, data-model.md `previewImage`)

### Verification

- [ ] T045 [P] [US1] Run quickstart V2.1: no horizontal scrolling at 320px or at a wide desktop width, and no body line beyond roughly 75 characters (FR-008)
- [ ] T046 [P] [US1] Run quickstart V2.2: the whole page traversable by keyboard with a clearly visible focus indicator (FR-006, and the keyboard half of SC-005)
- [ ] T047 [P] [US1] Run quickstart V2.5: confirm no raw colour, size or spacing literal appears in any component style block. Every value comes from a token (Principle VI)
- [ ] T048 [US1] Run quickstart V2.3, a Lighthouse mobile audit: 100 for Accessibility, Best Practices and SEO, Performance at 95 or above. Accessibility at 100 is the automated-audit half of SC-005. Record the four scores in this task, since this is the manual half of Principle VII per plan.md's Complexity Tracking. Record First Contentful Paint and Largest Contentful Paint from the same throttled run and check both against SC-002's 1s-readable and 3s-complete targets, since the byte budgets are a proxy for those rather than a measurement of them (SC-002)
- [ ] T049 [US1] Run `node scripts/check-budgets.mjs`: photograph under 150KB, total under 250KB, HTML plus CSS under 20KB, zero JavaScript (SC-002 budgets)
- [ ] T050 [US1] Run quickstart V3.1 with five people who have not met Joe. All five state his profession and location after ten seconds (SC-001)

**Checkpoint**: US1 complete. The site does the job it exists for.

---

## Phase 6: User Story 4 - Visitor follows Joe elsewhere (Priority: P4, build stage S3)

**Goal**: A short set of verified links to Joe elsewhere. Strictly additive: a dead link is worse
than no link.

**Independent Test**: Follow every displayed link. Each reaches a live page belonging to Joe.

- [ ] T051 [US4] Extend the schema in `src/lib/site.ts` with a `links` array of `label` and `url`, requiring absolute `https:` URLs, rejecting duplicate URLs, and allowing the array to be empty (FR-004, data-model.md)
- [ ] T052 [US4] **OWNER** Confirm which links to display. contracts/content-schema.md assumes two, GitHub and LinkedIn, and assumes the Twitter and Instagram profiles are dropped unless confirmed active. Confirm each destination is live before it ships (FR-020)
- [ ] T053 [US4] Add the confirmed links to `src/data/site.md` and render them in `src/pages/index.astro` as a list, with no icons, and distinguishable as links without relying on colour alone (FR-004, Principle VI). Confirm that adding one more link afterwards is a single frontmatter entry touching no other file (FR-012)
- [ ] T054 [US4] Verify the page still renders correctly with an empty `links` array, by emptying it temporarily and rebuilding (FR-004)
- [ ] T055 [P] [US4] Run quickstart V3.3: every displayed link reaches a live destination belonging to Joe (SC-004)
- [ ] T056 [P] [US4] Confirm each link is keyboard-focusable with a visible indicator, and that no link label is meaningless out of context (FR-006, data-model.md)

**Checkpoint**: All four user stories independently functional.

---

## Phase 7: Polish and Cross-Cutting Concerns

- [ ] T057 [P] Re-read `README.md` against FR-015 now that links and the photograph exist, and confirm all three tasks are still findable in under twenty lines
- [ ] T058 [P] Re-run the full quickstart Stage 2 and Stage 3 validation lists end to end, rather than trusting the per-story runs
- [ ] T059 Confirm `provisional` appears nowhere in `src/data/site.md` or `src/lib/site.ts`, so the interim state cannot be reactivated by accident
- [ ] T060 Re-verify plan.md's Constitution Check against the finished code, and confirm the two recorded departures in Complexity Tracking, being the omitted ESLint and the un-automated Lighthouse, are both still the right call and still accurately described
- [ ] T061 Confirm `dependencies` still contains only `astro` and that no dev dependency arrived without its three-sentence justification in research.md (Principle III)
- [ ] T062 Consider backing up `PROJECT-BRIEF.md` and `DEFERRED-NOTES.md` outside the repository, since both are gitignored and the cutover detail and design lineage exist nowhere else
- [ ] T063 Grep the whole repository and the built `dist/` for `UA-39902836-1`, `google-analytics`, `gtag`, `googletagmanager` and `analytics`, confirming zero matches. The dead 2021 tracking property must not be carried over in any form and no replacement may have crept in (FR-019)
- [ ] T064 Confirm `dist/` contains exactly one HTML file and that the page has no navigation to any other page (FR-001), and confirm the absence of every v1 non-goal: no blog, CMS, portfolio, contact form, analytics, cookie notice, newsletter signup, comments, search or syndication feed (FR-022)
- [ ] T065 Confirm a later portfolio would be additive: `src/data/site.md`'s frontmatter shape and `src/lib/site.ts`'s schema must both accommodate a new content type alongside the existing keys without renaming, restructuring or moving anything currently there. Record in this task what a portfolio would add, so the claim is checked rather than assumed (FR-023, SC-010)
- [ ] T066 Confirm no Astro content collection and no dynamic route exists anywhere in `src/`, per Principle I and plan.md's exclusion of both from all phases

---

## Dependencies and Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies, start immediately
- **Foundational (Phase 2)**: depends on Setup. **Blocks every user story**
- **US2 (Phase 3)**: depends on Foundational. Delivered first, and is the MVP
- **US3 (Phase 4)**: depends on Foundational. T037 and T038 additionally need the site to be live, so in practice they follow T024
- **US1 (Phase 5)**: depends on Foundational. T041 through T044 are blocked on the owner supplying content
- **US4 (Phase 6)**: depends on Foundational. T053 assumes Phase 5's composition exists, so it is easier after US1
- **Polish (Phase 7)**: depends on all four stories. T063 is the exception: it can and should be run before T027 as well, since carrying a tracking property onto the live domain is worth catching early

### Hard ordering constraints

- **T025 before T027, always.** GitHub will reject the custom domain while the old repository's `CNAME` exists. This is the single easiest thing in the project to get wrong
- **Delete the `www` A record before adding the `www` CNAME**, inside T026. DNS forbids both at one name
- **T024 before T025.** Confirm the build deploys to `jburkinshaw.github.io` before repointing DNS, so the domain is never aimed at a broken build
- **T027 then wait, then T028 and T029.** Certificate provisioning can take up to 24 hours
- T011 before T012 before any component styling: tokens exist before anything consumes them
- T014 before T015 before T017: the schema exists before the parse, which exists before the layout that imports it
- T040 before T043: the schema must accept the new fields before content supplies them, or the build fails

### Within each story

Schema before content before template before verification. Verification tasks marked [P] are
independent of one another.

### Parallel Opportunities

- T005, T006 and T007 are three separate files, so they run together
- T013, T016 and T018 touch `src/data/`, `public/` and `scripts/` respectively, so they run together
- T029 through T033 are five independent verification passes over one deployed page
- T045, T046 and T047 likewise
- Nothing in the cutover, T025 through T028, is parallelisable. It is a strict sequence

---

## Parallel Example: Phase 2 Foundational

```bash
# Three independent files, no shared edits:
Task: "Create src/data/site.md with Stage 1 frontmatter"
Task: "Create public/favicon.svg"
Task: "Create scripts/check-budgets.mjs"
```

## Parallel Example: US2 Verification

```bash
# Five independent checks against one deployed page:
Task: "quickstart V1.8, all four addresses resolve securely"
Task: "quickstart V1.9, zero third-party requests"
Task: "quickstart V1.6, degradation with images, CSS and JS off"
Task: "quickstart V1.7, light and dark plus light-dark() fallback"
Task: "quickstart V1.5, reads as deliberately unfinished"
```

---

## Implementation Strategy

### MVP: Phases 1 to 3

Setup, Foundational, then US2. That yields a live, secure, provisional page at the real address, the
2021 site retired, and the standing DNS fault repaired. Stop and validate against SC-006, SC-007 and
SC-009 before going further.

Add Phase 4 next. It is four small tasks and it proves the pipeline works before any real content
depends on it, which is cheaper than discovering it does not while holding finished copy.

### Then, when content exists

Phase 5 delivers the story that actually justifies the site. Phase 6 is additive and can wait
indefinitely without leaving anything broken. Phase 7 is a re-check, not new work.

### The one thing to be careful about

T025 is irreversible. Everything else here can be undone with a revert.

---

## Phase 8: Convergence

Appended by `/speckit-converge` on 2026-09-02, assessing the code after Stage 1 against
spec.md, plan.md and the constitution. Existing tasks were not renumbered or altered.

- [X] T067 CRITICAL Remove the unused `Props` interface and its destructuring defaults from `src/layouts/Base.astro`, reading `title` and `description` directly from `metadata`, since the only caller passes no props and a second page does not exist, per Constitution I (unrequested)
- [X] T068 Extend `scripts/check-budgets.mjs` to fail when `dist/index.html` lacks an `@supports not (color: light-dark(...))` block containing all four colour tokens, per FR-007 and Constitution VII. This fallback was silently stripped by the CSS minifier once already and was invisible in source, so it needs a guard rather than a memory (missing)
- [X] T069 Extend `scripts/check-budgets.mjs` to fail when any file in `dist/` references an origin outside `joeburkinshaw.com`, covering `src`, `href`, `@import` and `url()`, so a stray third-party request cannot ship unnoticed, per FR-010, SC-007 and Constitution II (partial)

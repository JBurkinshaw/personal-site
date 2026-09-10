# Phase 0 Research: Single-Page Personal Site

**Date**: 2026-09-02

The stack was settled before this feature and is not re-opened here. What follows verifies the
version-sensitive claims the plan depends on, and resolves the open technical decisions. Two of the
verifications changed the plan; both are marked **Correction**.

---

## 1. Deploy action version and its Node default

**Decision**: Use `withastro/action@v6` and set `node-version: 22.16.0` explicitly.

**Verified**: The action's `action.yml` declares `node-version` with a default of `"24"`, confirmed
directly from source. Latest release is `v6.1.2`, published 2026-07-10. Other defaults worth
knowing: `path: "."`, `cache: "true"`, `out-dir: "dist"`, and `package-manager: ""`, which
auto-detects from the lockfile.

**Rationale**: The default of 24 is two major versions above local. An unpinned CI Node is a silent
upgrade waiting to break a build nobody touched, which is exactly what Principle IV's pinning clause
exists to prevent.

**Version corrected during implementation.** The pin was first 22.16.0, matching the local install
and satisfying Astro's own `engines.node >=22.12.0`. Installing revealed that `astro` depends on
`unifont`, which depends on `undici@8.10.1`, which requires Node `>=22.19.0`, so every install
emitted an `EBADENGINE` warning. `unifont` backs Astro's font API, which this site does not use, so
nothing was broken, but a standing warning obscures real ones. The pin is now **22.23.2**, the
current Node 22 LTS at the time of writing, in `.nvmrc` and the workflow alike, and
`package.json` declares `engines.node >=22.19.0` to state the real transitive floor rather than
Astro's.

**Alternatives considered**: Floating on the action default was rejected for the reason above.
Pinning to the exact patch `v6.1.2` rather than the `v6` major tag was rejected because the major
tag picks up security patches without intervention, and a static site has no API surface for a minor
release to break. `.nvmrc` holds the version as the single source of truth so local and CI cannot drift.

---

## 2. `light-dark()` support

**Corrected twice.** The plan input assumed `light-dark()` could carry the token sheet alone. It
cannot. The first fix, a duplicate declaration, then turned out not to survive the build. What
follows is the mechanism that actually ships.

**Decision**: Declare each colour token once with `light-dark()` inside `:root`, set
`color-scheme: light dark`, and put the fallback in an `@supports not (...)` block after `:root`.

```css
:root {
  color-scheme: light dark;
  --colour-ink: light-dark(#17191b, #e9e7e3);
}

@supports not (color: light-dark(#000, #fff)) {
  :root {
    --colour-ink: #17191b;
  }
}
```

**Verified**: `light-dark()` is Baseline **newly available**, dated May 2024, and not yet Baseline
widely available. It requires `color-scheme` to be set, and is valid only where a `<color>` is
expected. The `@supports` block was confirmed present and intact in built output.

**Rejected after testing: the duplicate declaration.** Declaring each token twice, plain value then
`light-dark()`, reads well and needs no feature query, and it was the original decision here. It
does not work. The CSS minifier treats a declaration overridden later in the same rule as dead and
strips it, so the source carried two declarations per token and `dist/index.html` carried one. The
fallback was silently absent from every build. This was caught by grepping built output rather than
by reading source, which is the only way it could have been caught.

**Consequence if unguarded**: each `var()` substitution becomes invalid at computed-value time, so
the property resolves to `unset`. Text falls back to inherited black on a transparent canvas. The
page stays readable, but dark mode disappears entirely and the accent, the secondary grey and the
derived hairline rule all collapse, which is the degradation FR-007 forbids.

**Alternatives considered**: `@media (prefers-color-scheme: dark)` overrides would work everywhere
with no feature query, but double the token block and read worse. Relying on `light-dark()`
unguarded is defensible given the spec's assumption of current browsers only, and becomes more so
when `light-dark()` reaches Baseline widely available around November 2026; it was rejected because
the guard costs seven lines and a few dozen bytes. Disabling CSS minification was rejected outright
for the budget cost.

---

## 3. Achieving one render-blocking request

**Decision**: Set `build.inlineStylesheets: 'always'` in `astro.config.mjs`.

**Verified**: The option accepts `'always' | 'auto' | 'never'` and defaults to `'auto'`, which only
inlines stylesheets below Vite's `assetsInlineLimit`, itself 4kb by default.

**Rationale**: The CSS budget is 20KB, comfortably above the 4kb auto threshold, so the default
would leave the stylesheet external and cost a second round trip on the critical path. `'always'`
delivers the single-request constraint declaratively, with no build script and no dependency.

**Alternatives considered**: Hand-inlining CSS into the layout's `<head>` was rejected because it
abandons Astro's scoped-style compilation. Raising Vite's `assetsInlineLimit` instead was rejected as
a less direct expression of the same intent.

---

## 4. Validating content without content collections

**Decision**: Keep all content as frontmatter in `src/data/site.md`, imported as a plain Markdown
module, and validate it in `src/lib/site.ts` with `z` imported from `astro/zod`.

**Verified**: `astro/zod` is a documented re-export of Zod v4, and `astro@7.2.10` declares
`zod@^4.3.6` among its own dependencies, so no separate install is needed and no version skew is
possible. Direct Markdown import is supported outside collections and exposes `frontmatter`,
`<Content />`, `rawContent()` and `getHeadings()`. The file sits in `src/data/` rather than
`src/content/`: `src/content/` is not documented as reserved, but it is the conventional collections
location and putting a non-collection file there invites exactly the confusion Principle I is
written against.

**Rationale**: This satisfies FR-013 with zero new dependencies. Content collections were the
obvious tool and are explicitly excluded by Principle I, since a collection for a single document is
schema for content that does not exist. Frontmatter beats a JSON data file for FR-011, because JSON
punishes a hurried edit with a trailing comma, while frontmatter tolerates loose spacing and reads as
prose.

**Alternatives considered**: Installing `zod` directly was rejected as a needless dependency and a
version-skew risk against Astro's own copy. YAML in a separate file was rejected because Vite cannot
import YAML without a plugin. A hand-written type guard was rejected because it would produce worse
error messages than Zod for exactly the malformed-edit case FR-013 targets.

---

## 5. Lint and format toolchain

**Decision**: Four dev dependencies. `@astrojs/check` and `typescript` for type checking,
`prettier` and `prettier-plugin-astro` for formatting. No ESLint.

**Correction to the plan input.** The plan first recorded two dev dependencies on the assumption that
`astro check` was self-contained. It is not: `astro@7.2.10` declares neither `@astrojs/check` nor
`typescript` among its dependencies, and `@astrojs/check@0.9.10` declares `typescript` as a peer
dependency. Both must be installed explicitly or the constitution's type-check gate cannot run at
all.

**Justification per Principle III, three sentences each:**

- **`@astrojs/check`**: Provides the `astro check` command itself, which type-checks `.astro`
  templates as well as `.ts` files. It replaces nothing hand-written, because there is no way to
  type-check Astro template expressions without it. Without it the constitution's Development
  Workflow type-check gate is unenforceable, so it is a prerequisite rather than a convenience.
- **`typescript`**: The compiler `@astrojs/check` declares as a peer dependency and the thing that
  actually enforces `strict` mode. It replaces the alternative of writing untyped JavaScript and
  discovering content-shape errors in the browser. It cannot be hand-written by any reasonable
  reading.

- **`prettier`**: Formats every file type in the tree to one canonical shape, and provides the
  `--check` mode the constitution's Development Workflow requires as a blocking gate. It replaces
  either a hand-maintained style guide nobody follows or a stream of whitespace-only diffs. It cannot
  reasonably be hand-written, since the thing being replaced is a formatting algorithm.
- **`prettier-plugin-astro`**: Teaches Prettier the `.astro` file format, which it otherwise cannot
  parse at all. Without it, every component file is excluded from the formatting gate, which is most
  of the source tree. It exists because `.astro` is a bespoke syntax and no generic formatter handles
  it.

**No dedicated linter.** Constitution v1.0.1 requires type check, build and format as blocking
gates, and requires the linter decision to be recorded at plan level either way. This section is
that record. ESLint is omitted because the lintable surface is close to empty: zero client
JavaScript, one page, `strict` TypeScript, and `astro check` already reporting unused variables,
unreachable code, type errors and template diagnostics. Adding it would mean roughly four more dev
dependencies and a config to maintain for near-zero marginal signal, which is what Principle III
exists to prevent. **Revisit when** client-side JavaScript is introduced under Principle II's
exception process, or when a second contributor joins and shared conventions stop being implicit.

**Alternatives considered**: Biome would collapse lint and format into one dependency, but its
`.astro` support covers only the embedded script portion rather than the template, so it cannot
format the majority of the source tree. `dprint` has the same gap. Formatting by hand was rejected
because the constitution requires format as a blocking check, which needs a checker.

---

## 6. Enforcing the byte budgets

**Decision**: `scripts/check-budgets.mjs`, using only Node builtins, run in CI after the build and
before the deploy. It fails non-zero if any JavaScript is emitted, if HTML plus CSS exceeds 20KB
uncompressed, if any image exceeds 150KB, or if total page weight exceeds 250KB.

**Rationale**: The failure mode Principle VII is written against is a budget quietly drifting over
months. A script that reads `dist/` and adds up file sizes catches precisely that, in perhaps thirty
lines, with no dependency. The JavaScript check is the important one, because Principle II's whole
guarantee is a number that a single careless `client:load` would silently break.

**Alternatives considered**: Lighthouse CI covers more but costs a headless Chrome download per run
and a heavy dev dependency, to audit one static page; deferred to manual runs and recorded in the
plan's Complexity Tracking. `bundlesize` and similar packages were rejected as a dependency for
arithmetic over `fs.statSync`.

---

## 7. Cutover ordering and the standing DNS fault

**Decision**: Three manual owner tasks, in a fixed order, with a wait between the second and third.
Full detail in [contracts/deployment.md](./contracts/deployment.md).

**Rationale**: GitHub scopes a custom domain to one repository. While the old repository's `CNAME`
file exists, this repository cannot claim `joeburkinshaw.com`, so ordering is not a preference but a
hard dependency. The current secure-address timeout is caused by apex A records pointing at the
retired `192.30.252.x` range rather than the current `185.199.10x.153` block, which is a pre-existing
fault that step 2 repairs.

**Risk worth naming**: step 1 is the only step in the sequence with no undo. Deleting the old
`CNAME` and archiving that repository retires the 2021 site permanently. That is the intent, but it
should be done deliberately rather than discovered halfway through the sequence.

**Alternatives considered**: Running the cutover before the site builds and deploys was rejected,
because it would point a live domain at nothing. Deferring the cutover until real content exists was
considered and rejected by the owner, on the grounds that a clean provisional page reflects better
than five-year-old content and that the broken HTTPS is worth fixing now. That decision is what
amended FR-021.

---

## 8. Typeface

**Decision**: Jost\*, one family, self-hosted as a Latin subset variable `woff2` at 9.7KB,
preloaded, with a geometric fallback stack.

**Rationale**: The design adopted is Bauhaus-derived, and Jost\* is an open interpretation of
Futura, the face most associated with that lineage. It is the single strongest signal available
without licensing a commercial revival. One family only, so Principle VI's type clause holds
without the two-typeface amendment that was discussed and turned out not to be needed.

**Fallback, and why it is a stack rather than a computed override**: `research.md` section 1's
sibling requirement is a metric-matched fallback. `fontTools` is not installed here, so the real
`sxHeight` and `unitsPerEm` could not be read, and inventing a `size-adjust` number that cannot be
verified would be worse than not declaring one. Instead the fallback is a stack of geometric faces
with proportions close to Jost\*, being Futura, Avenir Next and Century Gothic, at least one of
which is present on most desktop systems. The claim was then tested rather than asserted:
**Lighthouse reports Cumulative Layout Shift of 0** on the built page, which is the outcome the
requirement exists to protect. If a future change introduces shift, compute the override properly
with `fontTools` at that point.

**Alternatives considered**: Archivo and Inter are better neo-grotesques but belong to the Swiss
strand rather than the Bauhaus one, and were used in the discarded prototypes. Loading Futura
itself was rejected on licensing. Keeping the system stack was rejected because it is what made the
previous design read as unstyled defaults.

## Sources

- [withastro/action `action.yml`](https://github.com/withastro/action/blob/main/action.yml)
- [withastro/action latest release](https://github.com/withastro/action/releases/latest)
- [astro on npm](https://registry.npmjs.org/astro/latest)
- [Jost\* by indestructible type](https://indestructibletype.com/Jost.html)
- [MDN: `light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)
- [Astro configuration reference: `build.inlineStylesheets`](https://docs.astro.build/en/reference/configuration-reference/)
- [Astro Zod API reference (`astro/zod`)](https://docs.astro.build/en/reference/modules/astro-zod/)
- [GitHub Pages: managing a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

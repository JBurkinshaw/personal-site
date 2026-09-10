<!--
SYNC IMPACT REPORT
==================

--- Amendment 1.0.1 -> 1.1.0 (2026-09-10) ---
MINOR: Principle VI materially expanded. No principle added, removed or redefined.

Modified section: Principle VI, Restraint Is The Design.
  Was: one prose paragraph requiring "one typeface ... a near-monochrome palette, and hairline
  rules rather than boxes and shadows".
  Now: six labelled clauses covering type, colour, form, marks, both appearances, and motion.
  Colour is capped at six tokens, with anything beyond ink, paper and one secondary required to
  carry a stated structural meaning. Geometric primitives are admitted as structure. A graphic
  mark is admitted only where it does a job text alone cannot.

Retained unchanged: the prohibition on shadows, gradients, blurs, background patterns, decorative
icons and emoji as interface; the one-sentence defensibility test; the token requirement; the
light and dark clause; the motion clause.

Rationale: the site adopted a Bauhaus-derived design in which colour is tied to form, after
Kandinsky's circle-to-blue and square-to-red mapping, and in which a location pin links to a map.
The previous wording forbade both, so it described a design the project no longer has. Amending
the principle is the honest route; leaving it and recording two departures would have made the
principle decorative.

Invalidated by this amendment: nothing in code. plan.md's Constitution Check row for Principle VI
should be re-verified against the new clauses once the design ships.

Principles: unchanged, all seven intact.

--- Amendment 1.0.0 -> 1.0.1 (2026-09-02) ---
PATCH: wording clarification, no principle added, removed or redefined.

Modified section: Development Workflow.
  Was: "Type check, build, lint and format MUST run as blocking checks."
  Now: "Type check, build and format MUST run as blocking checks", followed by a requirement that
  the linter decision be recorded at plan level either way.

Rationale: the previous wording mandated a blocking gate this project deliberately does not build.
plan.md Complexity Tracking recorded the omission of ESLint per the Governance departure clause,
but a MUST that is permanently unmet erodes the authority of the others. The amendment states the
actual standard and keeps the decision explicit rather than silent.

Invalidated by this amendment: the ESLint row in plan.md Complexity Tracking is no longer a
departure and should be removed, with its reasoning retained in research.md section 5.

Principles: unchanged, all seven intact.

--- Initial ratification -> 1.0.0 (2026-09-01) ---
Version change: (unset template) -> 1.0.0
Rationale: initial ratification. No prior version existed; the file held only unfilled
template placeholders, so this is an initial adoption rather than an amendment.

Principles defined (7; template scaffold provides 5 slots, extended per user input):
  - I. Simplicity Is The Requirement
  - II. Zero JavaScript By Default (NON-NEGOTIABLE)
  - III. Platform Over Packages
  - IV. Publish By Push
  - V. Content Is Editable Without Reading Code
  - VI. Restraint Is The Design
  - VII. Quality Is Measured, Not Asserted

Modified principles: none (no prior principles existed).
Renamed principles: none.

Sections added (resolved from template placeholders):
  - [PROJECT_NAME] -> joeburkinshaw.com
  - [SECTION_2_NAME] -> Additional Constraints
  - [SECTION_3_NAME] -> Development Workflow
  - Governance -> populated with amendment procedure, versioning policy, compliance review

Sections removed: none.

Source: project research and decision record, 2026-09-01, held in local working notes.
Deliberately excluded as planning material rather than governance, and carried in local
working notes for the spec and plan stages: numeric performance budgets, accessibility
thresholds, code style rules, concrete design specifications and reference lineage, target
file structure, and the ordered manual DNS/Pages cutover steps.

Follow-up TODOs: none. No placeholder tokens deferred.
-->

# joeburkinshaw.com Constitution

## Core Principles

### I. Simplicity Is The Requirement

The smallest thing that works is the correct thing. Features MUST NOT be added because they are
possible or conventional; each one MUST be argued for against what a visitor currently cannot do.
Structure MUST NOT be built in advance of a second use case: no abstraction with one caller, no
schema for content that does not exist yet. Equally, no choice MAY foreclose a plausible later
addition by forcing a rewrite.

**Rationale:** The site this replaces died of more machinery than its owner had appetite to
maintain. Restraint is the feature, not a compromise.

### II. Zero JavaScript By Default (NON-NEGOTIABLE)

Pages MUST ship no client-side JavaScript unless a named user-facing capability genuinely cannot be
delivered by HTML and CSS. Any exception MUST be isolated so the rest of the site pays nothing for
it, MUST degrade to a usable page when it fails to load, and MUST NOT pull in a framework runtime to
power a widget. Third-party scripts, embeds, and requests to origins this repository does not
control are prohibited.

### III. Platform Over Packages

Dependencies are permanent liabilities and the default answer is no. Native platform features MUST
be preferred over tooling that wraps them. Adding any dependency MUST be accompanied by three
things: what it does, what hand-written code it replaces, and why that code should not simply be
written.

### IV. Publish By Push

Publishing MUST be: edit, merge to the default branch, live. No manual build step, no committed
build output, no deploy runbook. The build MUST succeed from a clean clone with no local setup and
no secrets. A failing build MUST block the deploy rather than degrade the site silently. Any step a
human must perform by hand MUST be recorded as an explicit owner task and never assumed.

### V. Content Is Editable Without Reading Code

Human-authored content MUST live in data or Markdown with typed frontmatter, never inline in
template markup, and MUST be editable entirely through a web browser by someone with no toolchain
and no loaded context. A malformed edit MUST fail the build with a readable error rather than
publish a broken page. Adding one more of an existing thing MUST be a data edit, not a markup edit.

### VI. Restraint Is The Design

The aesthetic is modernist information design: clarity, hierarchy, and negative space, not
decoration.

- **Type.** Exactly one family, self-hosted, with few weights and few sizes from one documented
  scale, and one documented spacing scale.
- **Colour.** At most six tokens. Ink, paper and one secondary need no justification. Any colour
  beyond those three MUST carry a stated structural meaning recorded alongside the token, and MUST
  NOT be applied for variety.
- **Form.** Geometric primitives, a circle, a square, a bar, a hairline rule, MAY be used as
  structure. Boxes, shadows, gradients, blurs, background patterns, decorative icons and emoji as
  interface MUST NOT.
- **Marks.** A graphic mark is permitted only where it does a job the text alone cannot, such as
  signalling that a place name opens a map. A mark that merely accompanies text is ornament and MUST
  be removed.
- **Both appearances.** Light and dark MUST both be first-class, neither a degraded version of the
  other.
- **Motion.** The exception rather than the default, and reduced-motion preferences MUST be
  honoured.

Every visual element MUST be defensible in one sentence as serving legibility, hierarchy, or
navigation; an element justified by looking impressive MUST be removed. All values MUST come from
shared design tokens, so a raw colour or spacing literal in a component is a defect.

**Rationale:** Aiming at modern-but-timeless means borrowing from design that has already lasted
sixty years rather than from whatever currently looks new. The colour and form clauses are written
to admit that lineage rather than a diluted version of it: the Bauhaus tied colour to form, and a
rule that permitted only monochrome would have ruled out the tradition the site is drawing on while
still admitting any amount of tasteful greyness.

### VII. Quality Is Measured, Not Asserted

This project has one reviewer, so its standards MUST be numeric and enforced by CI rather than
remembered. Every release MUST hold a stated performance budget, an accessibility floor including
keyboard operability and semantic structure, and a type-checking and build gate. Gates MUST NOT be
weakened or skipped to unblock a merge; a breach is a defect to fix, not a target to renegotiate.
Concrete thresholds are set in the plan and MAY tighten at any time, but MUST NOT be loosened
without an amendment to this constitution.

## Additional Constraints

The stack is already researched and decided: Astro, GitHub Pages deployed via GitHub Actions,
scoped component styles plus one global token sheet, built up from the bare starter. Planning MUST
treat these as given and MUST NOT reopen the framework comparison without new evidence.

Two facts about the existing deployment MUST survive into planning because they are easy to lose:
the old repository's `CNAME` MUST be removed before this repository can claim the custom domain, and
the live DNS currently points at a deprecated GitHub IP block, which is a standing bug rather than a
side effect of this rebuild.

## Development Workflow

The default branch MUST always be deployable, because it is what gets deployed. Type check, build
and format MUST run as blocking checks. Whether a dedicated linter joins them is a plan-level
decision that MUST be recorded either way, since at small scale type checking may already cover the
entire lintable surface. Before merging, the following MUST be confirmed: the client JavaScript
payload is unchanged, no dependency was added without its justification, no design literal escaped
the token sheet, and the page holds up small, wide, light, dark, and keyboard-only.

## Governance

This constitution supersedes habit and preference. Where it is silent, choose the smaller option and
record the choice.

**Amendment procedure:** An amendment requires an edit to this document, a version bump, a one-line
rationale in the Sync Impact Report, and a note of what existing code the change invalidates.

**Versioning policy:** Semantic versioning. MAJOR for removing or redefining a principle in a
backward-incompatible way; MINOR for adding a principle or materially expanding guidance; PATCH for
clarifications and wording.

**Compliance review:** Re-read this document when starting a feature spec and before adding any
dependency. Any deliberate departure MUST be recorded in the relevant plan with its reason and what
would have to be true to remove it; an unrecorded departure is a defect. Because this project has a
single reviewer, the automated gates required by Principle VII are the enforcement mechanism and
MUST NOT be disabled to unblock work. Numeric budgets and the ordered manual cutover steps are
planning-level detail: they belong in the feature spec, plan and task list, not in this document.

**Version**: 1.1.0 | **Ratified**: 2026-09-01 | **Last Amended**: 2026-09-10

# Phase 1 Data Model: Single-Page Personal Site

**Date**: 2026-09-02

Three entities from the spec, all resolved from one file. There is no database, no runtime store and
no persistence: the model is the shape of `src/data/site.md`'s frontmatter, validated at build
time and consumed as typed data.

Fields are marked with the phase that populates them. A field belonging to a later phase is absent
from the schema until that phase, per Principle I's prohibition on schema for content that does not
yet exist.

---

## Profile

Exactly one exists. The single subject of the site.

| Field | Type | Phase | Rules |
|---|---|---|---|
| `name` | string | P1 | Non-empty, trimmed. Rendered as the page's only `<h1>` (FR-003). |
| `provisional` | boolean | P1 | When true, the page renders its interim state per FR-021. Removed at Phase 3, not merely set false, so it cannot be forgotten. |
| `role` | string | P3 | Non-empty. Profession, per FR-003 and SC-001. |
| `location` | string | P3 | Non-empty. Per FR-003 and SC-001. |
| `bio` | Markdown body | P3 | The file body rather than a frontmatter field, so it can be written as prose across a few lines. |
| `photo` | image reference | P3 | Resolves to a file under `src/assets/`. Build fails if absent. |
| `photoAlt` | string | P3 | Non-empty, and must not equal `name`, to block the useless "photo of Joe" alternative text FR-002 warns against. |

**Validation rules**

- `name` is required from Phase 1. Every other field arrives with its phase.
- No field may be an empty string. An empty string is a more likely mistake than a deliberate blank,
  and silently renders as missing content.
- `photoAlt` must be present whenever `photo` is. Neither is optional at Phase 3.

**State transitions**

One, and it is one-way. `provisional: true` at Phase 1 becomes the key's removal at Phase 3, when
`role`, `location`, `bio`, `photo` and `photoAlt` all become required simultaneously. There is no
partially-real state: the page is either the declared interim one or the finished one.

---

## Link

Zero or more. An external destination worth showing. The set is expected to stay at roughly two and
nothing here needs to work well at fifty.

| Field | Type | Phase | Rules |
|---|---|---|---|
| `label` | string | P3 | Non-empty. The visible text. Must be meaningful out of context, so not "here" or "click". |
| `url` | string | P3 | Must parse as an absolute `https:` URL. Relative and `http:` values are rejected. |

**Validation rules**

- Array order is display order. There is no `order` field, because the array already has one and a
  second source of truth invites disagreement.
- Duplicate `url` values are rejected.
- `https:` is required rather than merely preferred, since every intended destination supports it and
  an `http:` link from an HTTPS page is a needless mixed-signal.
- The array may be empty, and the page must render correctly when it is (FR-004). At Phase 1 it is
  absent entirely.

**Not modelled**

No `icon` field. Icons would be a dependency or an inline SVG per link, and Principle VI treats
decorative icons as forbidden ornament. No `rel` or `target` field: link behaviour is the template's
concern, not content the owner should have to reason about.

---

## Page metadata

Exactly one exists. What the page tells search engines and messaging apps about itself (FR-009).

| Field | Type | Phase | Rules |
|---|---|---|---|
| `title` | string | P1 | Non-empty. Used for `<title>` and `og:title`. |
| `description` | string | P1 | Non-empty, and at most 160 characters so search engines do not truncate it mid-sentence. Used for the meta description and `og:description`. |
| `previewImage` | image reference | P2 | The share-preview image. Separate from `photo`, because the two have different aspect ratio needs. |

**Validation rules**

- The canonical URL is not a content field. It derives from `site` in `astro.config.mjs`, so it
  cannot drift from the deployed address or be typed wrongly by hand.
- `description` doubles as both the meta description and the Open Graph description. Splitting them
  was rejected: two fields the owner must keep in sync is a worse failure mode than one field that
  serves both adequately.

---

## Relationships

Flat, and deliberately so.

```text
site.md
├── frontmatter
│   ├── Profile fields   (one)
│   ├── Page metadata    (one)
│   └── links[]          (zero or more Link)
└── body → Profile.bio   (P3)
```

Profile and Page metadata are separate entities in the spec but share one frontmatter block, because
splitting them across two files would double the number of places the owner has to look for a
one-line change, against FR-011's intent. `src/lib/site.ts` parses the block once and exports the
three entities as separately typed values, so the template still consumes them distinctly.

---

## Failure behaviour

Any validation failure exits the build non-zero, naming the offending field and what was expected.
The last successfully published page stays live, which is FR-013 and SC-008. The mechanism is a
`safeParse` at module scope in `src/lib/site.ts`: because the layout imports it, the failure occurs
during `astro build` rather than at request time, and there is no request time to fail at.

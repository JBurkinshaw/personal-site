# Contract: Content File

**Interface**: `src/data/site.md`
**Between**: the site's owner, editing in a browser, and the build.
**Stability**: breaking this shape fails the build. It does not fail the live site.

This is the only file the owner needs to open to change what the page says. Everything in it is
frontmatter or prose. Nothing in it is code.

---

## Phase 1 shape

```markdown
---
name: Joe Burkinshaw
title: Joe Burkinshaw
description: Geospatial specialist and software developer. Site being rebuilt.
provisional: true
---
```

The body is empty at Phase 1. The page renders its declared interim state.

## Phase 3 shape

```markdown
---
name: Joe Burkinshaw
title: Joe Burkinshaw
description: Geospatial specialist, software developer and map guy in Squamish, BC.
role: Geospatial specialist and software developer
location: Squamish, British Columbia
photo: ../assets/joe.jpg
photoAlt: Joe Burkinshaw standing on a forest trail, mountains behind him
links:
  - label: GitHub
    url: https://github.com/JBurkinshaw
  - label: LinkedIn
    url: https://ca.linkedin.com/in/joeburkinshaw
---

Joe Burkinshaw is a geospatial specialist, software developer, map guy and
outdoor enthusiast based in Squamish, British Columbia.
```

`provisional` is removed rather than set to `false`, so the interim state cannot be left switched on
by accident.

---

## Guarantees to the owner

1. **Adding a link is one entry.** Append a `label` and `url` pair to `links`. No other file changes.
   No ordering field: the list order is the display order.
2. **A mistake is caught before publication.** A missing field, an empty value, a malformed URL or a
   duplicate link stops the build and names the problem. Visitors keep seeing the last good page.
3. **No field is optional at its phase.** If a field applies, it must have a value. There is no
   partially-filled state.
4. **The canonical URL is not yours to maintain.** It comes from the site configuration, so it cannot
   drift from the real address.

## Constraints the build enforces

| Rule | Applies to | Rejected because |
|---|---|---|
| Non-empty after trimming | every string field | An empty value renders as missing content, silently |
| `description` at most 160 characters | `description` | Search engines truncate mid-sentence beyond that |
| Absolute `https:` URL | `links[].url` | An `http:` link from a secure page is a needless downgrade |
| No duplicate URLs | `links` | Two entries to the same place is always an editing slip |
| `photoAlt` must differ from `name` | `photoAlt` | "Joe Burkinshaw" is not a description of an image (FR-002) |
| `photoAlt` required whenever `photo` is | both | An image without a text alternative fails FR-002 and SC-005 |

## What this contract does not cover

Link behaviour, being `rel` and `target`, belongs to the template. Styling, ordering conventions and
the design tokens are not content. The photograph's processing, being format, sizes and compression,
is the build's concern; the owner supplies one file and its description.

# Contract: Content File

**Interface**: `src/data/site.md`
**Between**: the site's owner, editing in a browser, and the build.
**Stability**: breaking this shape fails the build. It does not fail the live site.

This is the only file the owner needs to open to change what the page says. Everything in it is
frontmatter or prose. Nothing in it is code.

---

## Shape

```markdown
---
name: Joe Burkinshaw
role: Technical leader, senior full-stack developer and geospatial expert
location: Squamish, British Columbia
photo: joe.jpg
photoAlt: Black and white head and shoulders photograph of Joe Burkinshaw smiling, with a forest behind him
links:
  - label: GitHub
    url: https://github.com/JBurkinshaw
  - label: LinkedIn
    url: https://ca.linkedin.com/in/joeburkinshaw
---

The bio, as prose. The page renders the Markdown body below the frontmatter.
```

`description` is the only optional field. Omitted, it becomes `role` in `location`; add it only to
say something else.

Two things are derived rather than stored, so there is no second value to keep in step: the page
title, which equals `name`, and the map link behind `location`, which is that string encoded into
Google's Maps URLs form.

An earlier interim shape carried `title` and `provisional` fields. Both are gone and the schema now
rejects them. The interim state is recorded in the spec's assumptions, not here.

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

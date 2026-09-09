# joeburkinshaw.com

A rebuild of my personal site. The original had been sitting untouched since 2021 and
needed a refresh, and it was a good excuse to try spec-driven development with
[Spec Kit](https://github.com/github/spec-kit) on something small enough to finish.
The specification, plan and task list live in [`specs/`](specs/).

One page, zero client JavaScript, published by pushing to `main`.

## Changing what the site says

Everything is frontmatter in [`src/data/site.md`](src/data/site.md). Edit it in your
editor or in the browser on GitHub, commit to `main`, and the site redeploys itself
within a few minutes.

| Field         | What it changes                                   |
| ------------- | ------------------------------------------------- |
| `name`        | The heading                                       |
| `title`       | Browser tab and link previews                     |
| `description` | Meta description and link previews, max 160 chars |

Get it wrong and the build fails instead of publishing, so the live site stays as it
was. The Actions tab names the offending field.

The photograph, bio prose and external links are not wired up yet.

## Stack

[Astro](https://astro.build) 7, building static HTML with no client-side JavaScript.
TypeScript in strict mode. Vanilla CSS: scoped styles per component plus one token
sheet in [`src/styles/global.css`](src/styles/global.css). Content is Markdown
frontmatter validated at build time with Zod, so a bad edit fails the build rather
than publishing. Deployed to GitHub Pages by GitHub Actions on every push to `main`.

Requires Node 22.23.2, per `.nvmrc`. No framework, no CSS library, no web fonts, no
analytics, and no requests to any third-party origin.

## Locally

```sh
nvm use          # Node 22.23.2, per .nvmrc
npm ci           # exact lockfile versions, same as CI resolves
npm run dev      # http://localhost:4321
npm run check    # formatting and types
```

Use `npm ci` rather than `npm i` unless you mean to move a dependency: `npm i` can
resolve newer versions inside the semver ranges and rewrite the lockfile as a side
effect, changing the build with nothing in the commit to say so.

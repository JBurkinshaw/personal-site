# Contract: Deployment and Addressing

**Interface**: the repository, GitHub Pages, and the DNS zone at Hover.
**Between**: a push to `main` and a visitor typing the address.

---

## Automated half

### Workflow shape

Two jobs are required. `withastro/action` does **not** deploy: it installs, runs the build command,
and uploads a Pages artifact via `actions/upload-pages-artifact`. A second job running
`actions/deploy-pages` performs the deployment.

```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: withastro/action@v6
        with:
          node-version: 22.16.0
          build-cmd: npm run build:ci

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

| Trigger | Effect |
|---|---|
| Push or merge to `main` | Build job installs, runs every gate, builds, uploads the artifact. Deploy job publishes it |
| Any gate failing | The build job fails, no artifact is produced, the deploy job never runs, and the previously deployed page stays live |
| Any other branch | Nothing deploys |

**Guarantees**: no manual build, no committed build output, no `gh-pages` branch, no secrets.
`npm ci && npm run build` reproduces the deployed output from a clean clone.

**Gates, all blocking, in this order**, run as the `build:ci` script so a failure aborts before the
artifact exists: `prettier --check .`, `astro check`, `astro build`,
`node scripts/check-budgets.mjs`.

**Pinned**: `node-version: 22.16.0`, matching `.nvmrc`. The action's own default is `24`, verified
from its `action.yml`, and must not be inherited. `cancel-in-progress: false` because cancelling a
half-finished Pages deployment is worse than queueing behind it.

---

## Manual half: the cutover

Three steps. **The order is a hard dependency, not a preference.** Steps 1 and 3 need GitHub account
access; step 2 needs a Hover login. No automated process here can perform any of them.

### Step 1. Release the domain from the old repository

In `JBurkinshaw/jburkinshaw.github.io`: delete the `CNAME` file, then archive the repository.

GitHub scopes a custom domain to one repository at a time. While that file exists, this repository
cannot claim `joeburkinshaw.com`; the setting is rejected as already taken. This must happen before
step 3, and the old repository must not be left live with the file in place.

> **No undo.** This retires the 2021 site permanently. That is the intent, but do it deliberately.

### Step 2. Repair the DNS zone

At Hover, on the `joeburkinshaw.com` zone. **Measured live on 2026-09-02**, so this reflects the
actual zone rather than the earlier written record:

| Action | Record | Value | Note |
|---|---|---|---|
| Delete | A, apex | `192.30.252.153` | Retired GitHub range |
| Delete | A, apex | `192.30.252.154` | Retired GitHub range |
| **Delete** | **A, `www`** | **`192.30.252.154`** | **Must go before the CNAME below** |
| Add | A, apex | `185.199.108.153` | |
| Add | A, apex | `185.199.109.153` | |
| Add | A, apex | `185.199.110.153` | |
| Add | A, apex | `185.199.111.153` | |
| Add | CNAME, `www` | `jburkinshaw.github.io` | |

> **Correction to the earlier record.** The project brief stated the `www` CNAME was missing. That
> was true of CNAMEs specifically but misleading: `www.joeburkinshaw.com` currently resolves through
> an explicit **A record** at `192.30.252.154`, confirmed by direct lookup, and `www` presently
> serves a 301. DNS forbids a CNAME coexisting with an A record at the same name, so the `www` A
> record must be deleted before the CNAME can be added. GitHub's own guidance says the same thing in
> general terms: remove any pre-existing default record before configuring.

The apex records being deleted point at a retired GitHub range and are the cause of the current
secure-address timeout, verified on 2026-09-02: `https://joeburkinshaw.com` fails to connect while
`http://joeburkinshaw.com` returns 200 with 2021 content. That fault predates this work; this step is
its repair, not a migration side effect.

### Step 3. Claim the domain

In this repository's settings: set Pages source to **GitHub Actions**, set the custom domain to
`joeburkinshaw.com`, then wait for GitHub to provision the certificate and enable **Enforce HTTPS**.

Provisioning can take up to 24 hours. A failed certificate during that window is the expected
transient state, not a defect, and the address should not be shared until Enforce HTTPS is on.

---

## Acceptance

All four must resolve to the same page, with a valid certificate and no browser warning (SC-006):

- `https://joeburkinshaw.com`
- `http://joeburkinshaw.com`
- `https://www.joeburkinshaw.com`
- `https://jburkinshaw.github.io/personal-site/`

The bare `https://jburkinshaw.github.io` returns 404 by decision: the old repository was
unpublished rather than given a redirect. See the spec's assumptions.

Plus: zero requests to origins outside the owner's control (SC-007), and the page complete and
readable with images blocked, styling disabled and scripting disabled (SC-009).

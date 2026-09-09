# Feature Specification: Single-Page Personal Site

**Feature Directory**: `specs/001-single-page-site`

**Feature Branch**: none (no branch hook configured; work proceeds on `main`)

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "A single-page personal site at joeburkinshaw.com: one page showing a
photograph, name, a short bio, and a small set of verified external links. Replaces an abandoned
2021 site. Explicit non-goals for v1: no blog, CMS, portfolio, contact form, analytics, cookie
banner, newsletter signup, comments, search or RSS. Content must be editable through a web browser
with no toolchain. A portfolio is a plausible v2 and must be additive rather than a rewrite."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A visitor finds out who Joe is (Priority: P1)

Someone who has just heard Joe's name, from a conference talk, a code review, a job application, or
a mutual contact, searches for him and lands on this page. They want to know, quickly and without
scrolling or clicking, who he is, what he does, and where he is based. They read a photograph, a
name, and a few lines of bio, and they leave with that answer.

**Why this priority**: This is the entire purpose of the site. If nothing else ships, a page that
answers "who is this person" is already worth more than the abandoned site it replaces.

**Independent Test**: Open the page with no prior context and no other feature present. A reader who
has never met Joe can state his profession and location from what is on screen, with no interaction
beyond arriving.

**Acceptance Scenarios**:

1. **Given** a visitor who has never seen the site, **When** the page finishes loading, **Then** a
   photograph, a name, and a bio of a few lines are all visible without scrolling on a typical
   phone and on a typical laptop.
2. **Given** a visitor on a slow or metered connection where images have not yet arrived,
   **When** they read the page, **Then** the name and bio are already legible and the photograph's
   place is described in text rather than appearing as a broken element.
3. **Given** a visitor whose device is set to dark appearance, **When** the page loads, **Then** the
   text and photograph are legible without the visitor changing any setting.
4. **Given** a visitor using a screen reader, **When** they move through the page, **Then** they
   encounter the name as the page's single top-level heading, followed by the bio, in that order.

---

### User Story 2 - A visitor reaches the site reliably at the expected address (Priority: P2)

Someone types or clicks `joeburkinshaw.com`. Today that request over HTTPS times out and only the
insecure address serves anything, and what it serves was last changed in 2021. After this feature,
every plausible form of the address arrives at the new page, over a secure connection, without a
browser warning.

**Why this priority**: A visitor who gets a timeout or a security warning never sees the content from
User Story 1. This is the difference between a site that exists and a site that is reachable.

**Independent Test**: From a browser with no cache, request the secure address, the insecure address,
and the `www` form. All three arrive at the same page with a valid certificate and no warning.

**Acceptance Scenarios**:

1. **Given** a visitor entering the secure address, **When** the request completes, **Then** the new
   page is served with a valid certificate and no interstitial warning.
2. **Given** a visitor entering the insecure address or the `www` form, **When** the request
   completes, **Then** they arrive at the single canonical secure address.
3. **Given** an existing inbound link to the previous GitHub-hosted project path, **When** it is
   followed, **Then** the visitor arrives at the new page rather than the 2021 content.
4. **Given** the site is shared in a message or social post, **When** the preview renders, **Then** a
   title, a short description, and an image appear rather than a bare URL.

---

### User Story 3 - The owner updates the content from a browser (Priority: P3)

Joe wants to change a sentence of his bio, swap the photograph, or correct a link. It is months since
he last touched the project and he has no memory of how it is built. He opens one file, in his editor
or in the browser on GitHub, edits it, saves, and the change is live shortly afterwards without him
running anything.

**Why this priority**: The site this replaces was abandoned in 2021 because updating it was more
effort than it was worth. A site that cannot be updated casually will be abandoned again, so this is
a requirement rather than a convenience.

**Independent Test**: With no development tools installed, change one sentence of the bio through a
web browser. The change appears on the live site without any further action.

**Acceptance Scenarios**:

1. **Given** the owner editing content in a web browser, **When** they save a valid change to the
   default branch, **Then** the live site reflects that change with no manual build or upload step.
2. **Given** the owner saves a change that is malformed, for example a link missing its destination,
   **When** the publish process runs, **Then** it stops and reports what is wrong, and visitors
   continue to see the last good version of the page.
3. **Given** the owner wants to add one more external link, **When** they edit content, **Then** they
   add a single labelled entry to a list and do not touch page structure or styling.
4. **Given** a newcomer to the repository, **When** they read the project's own instructions,
   **Then** they can find how to change the bio, swap the photograph, and add a link in under twenty
   lines of reading.

---

### User Story 4 - A visitor follows Joe elsewhere (Priority: P4)

Having read the bio, a visitor wants to see Joe's code, his professional history, or contact him.
They pick from a short, clearly labelled set of links and arrive at a live profile.

**Why this priority**: Genuinely useful, but strictly additive: the page answers its main question
without any links at all, and a dead or wrong link is worse than no link.

**Independent Test**: With only this story present on top of User Story 1, every displayed link is
followed and each one reaches a live page belonging to Joe.

**Acceptance Scenarios**:

1. **Given** the set of displayed links, **When** each is followed, **Then** it reaches a live
   destination that belongs to Joe, with no dead links and no redirects to a parked or deleted
   profile.
2. **Given** a visitor navigating by keyboard only, **When** they move through the links, **Then**
   each receives a clearly visible focus indicator and activates with the keyboard.
3. **Given** a visitor who cannot distinguish colours, **When** they scan the page, **Then** links
   are identifiable as links without relying on colour alone.

---

### Edge Cases

- A visitor blocks images entirely, or the photograph fails to load: the page must still read as a
  complete introduction, not a broken layout.
- A visitor disables styling: content must remain in a sensible reading order.
- A visitor is on a 320px-wide phone, or a very wide desktop display: no horizontal scrolling and no
  line of text so long it becomes hard to read.
- A profile linked from the page is later deleted or renamed, leaving a dead link that nobody
  notices: link correctness is verified at publication and is the owner's to re-check on edit.
- The owner edits content and introduces a broken reference, an unclosed quote, or a missing
  required field: the site must refuse to publish rather than publish a broken page.
- The interim placeholder state is live and a visitor arrives before real content lands: the page
  must read as deliberately unfinished rather than as a broken or abandoned site, and must not
  mislead the visitor about who the owner is.
- A visitor arrives from a search result pointing at a 2021 URL that no longer exists: they must get
  a sensible destination rather than a raw error.
- The certificate for the custom address has not yet been issued when the address is first switched
  over: this is a known transitional window, not a defect, and must be waited out before announcing.
- A visitor has scripting disabled: the page must be entirely unaffected.

## Requirements *(mandatory)*

### Functional Requirements

**Content and presentation**

- **FR-001**: The site MUST consist of exactly one page, reachable at the root address, with no
  navigation to any other page.
- **FR-002**: The page MUST display one photograph of the owner, with a text alternative that
  describes it meaningfully for anyone who cannot see it.
- **FR-003**: The page MUST display the owner's name as the single top-level heading, and a bio of a
  few lines stating profession and location.
- **FR-004**: The page MUST display a finite set of clearly labelled external links, and MUST render
  correctly when that set is empty.
- **FR-005**: The page MUST remain readable and complete when images do not load, when styling does
  not load, and when scripting is unavailable.
- **FR-006**: The page MUST be fully operable using a keyboard alone, with a visible indication of
  what is currently focused.
- **FR-007**: The page MUST be legible in both light and dark appearance without the visitor
  changing any setting, and neither appearance may be a degraded version of the other.
- **FR-008**: The page MUST be usable from a 320px-wide viewport up to a wide desktop display,
  without horizontal scrolling.
- **FR-009**: The page MUST provide a title, a short description, a canonical address, and a preview
  image so that sharing the address produces a meaningful preview.
- **FR-010**: The page MUST make no requests to any origin outside the owner's control, and MUST
  therefore require no cookie or consent notice.

**Content editing and publication**

- **FR-011**: All human-authored content, being the name, bio, photograph reference, alternative
  text, link labels and destinations, and page description, MUST be editable entirely through a web
  browser by someone with no development tools installed.
- **FR-012**: Adding or removing one external link MUST be a single content edit and MUST NOT
  require changing page structure or styling.
- **FR-013**: A malformed or incomplete content edit MUST prevent publication and MUST report what
  is wrong in terms the owner can act on. Visitors MUST continue to see the last successfully
  published version.
- **FR-014**: Saving a valid content change to the default branch MUST publish it automatically, with
  no manual build, upload, or approval step.
- **FR-015**: The repository MUST document, in under twenty lines, how to change the bio, swap the
  photograph, and add a link.

**Addressing and migration**

- **FR-016**: The site MUST be served at `https://joeburkinshaw.com` with a valid certificate.
- **FR-017**: The insecure address and the `www` form MUST both arrive at the single canonical
  secure address.
- **FR-018**: Existing inbound links to the previous GitHub-hosted *project* path,
  `jburkinshaw.github.io/personal-site/`, MUST arrive at the new page. The bare user-site address,
  `jburkinshaw.github.io`, is out of scope: see the assumption on retiring the old repository.
- **FR-019**: The previous site's tracking identifier MUST NOT be carried over in any form, and no
  replacement analytics may be introduced in this version.
- **FR-020**: Every displayed link and any displayed contact address MUST be confirmed as live and
  current before publication. Nothing may be copied forward from the previous site on trust.
- **FR-021**: Placeholder content MAY be published at the live address as a deliberate interim
  state, in order to retire the 2021 site and repair the broken secure address without waiting on
  final copy. Any placeholder MUST be self-evidently provisional to a visitor, MUST NOT assert
  anything untrue about the owner, and MUST NOT present a stand-in image as a photograph of the
  owner. The interim state MUST be replaced with real content before the address is shared or
  announced.

**Scope boundary**

- **FR-022**: This version MUST NOT include a blog, a content management system, a portfolio, a
  contact form, analytics, a cookie notice, a newsletter signup, comments, search, or a syndication
  feed.
- **FR-023**: The way content is stored MUST allow a later portfolio to be added alongside the
  existing content without restructuring or rewriting what this version produces.

### Key Entities

- **Profile**: The single subject of the site. One name, one short bio, one location, one photograph
  with its text alternative. Exactly one exists.
- **Link**: An external destination worth showing. A visible label and a destination address, in a
  deliberate display order. Zero or more exist, and the set is expected to stay small.
- **Page metadata**: What the page tells search engines and messaging apps about itself. A title, a
  short description, a canonical address, and a preview image.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Profession and location are both legible without scrolling or interaction, at a
  320px viewport and on a typical laptop, so a first-time reader has them within seconds. Testing
  this on a panel of readers was considered and dropped as disproportionate for one page.
- **SC-002**: The page's text is readable within one second of request on a typical mobile
  connection, and fully complete including the photograph within three seconds.
- **SC-003**: The owner can change a sentence of the bio and see it live within five minutes, using
  nothing but a web browser and having read no more than twenty lines of instruction.
- **SC-004**: 100% of displayed links reach a live destination belonging to Joe on the day of
  publication.
- **SC-005**: The page can be read and operated start to finish using a keyboard alone, and an
  automated accessibility audit reports zero violations.
- **SC-006**: The secure address, the insecure address, and the `www` form all arrive at the same
  page with a valid certificate and no browser warning. The previous GitHub-hosted project path
  forwards there too.
- **SC-007**: The page makes zero requests to origins outside the owner's control, so no consent
  notice is required.
- **SC-008**: Every malformed content edit is caught before publication, and no such edit has ever
  been visible to a visitor.
- **SC-009**: The page remains a complete, readable introduction with images blocked, with styling
  disabled, and with scripting disabled.
- **SC-010**: Adding a portfolio in a later version requires no change to any content produced by
  this version.

## Assumptions

- **Owner-supplied content is a dependency, not a deliverable.** The photograph and the final bio
  copy come from the owner. The site is deliberately published with obvious placeholders before that
  content exists, on the conditions set by FR-021, so that User Story 2 can be delivered first.
- **Success criteria are measured at content completion, not at first deploy.** SC-001, SC-003 and
  SC-004 depend on real copy and verified links, and cannot be assessed against the interim
  placeholder state.
- **No contact email is displayed.** Contact happens through the linked professional profiles.
  Publishing an address invites scraping for no clear gain on a page whose purpose is introduction
  rather than correspondence. Reversing this is a one-line content edit under FR-012.
- **Two links are assumed, not four.** The professional links from the previous site, being the code
  host and the professional network, are assumed to be carried forward subject to FR-020. The two
  personal social links are assumed dropped unless the owner confirms both are active and worth
  showing, on the grounds that a link to a dormant profile reflects worse than its absence.
- **The bio starts from the previous site's description** and is corrected and updated rather than
  written from nothing. The previous description contained a typographical error that must not be
  carried over.
- **The address stays registered.** The domain is paid through 2027-03-28 and no registrar change is
  in scope.
- **Manual configuration steps belong to the owner.** Changing DNS records and hosting settings
  requires accounts that no automated process here can access. These steps are prerequisites for
  User Story 2, they must happen in a specific order, and they are the owner's to perform.
- **The current failure is pre-existing.** The secure address times out today because the address
  records point at a retired range. This is a standing fault rather than something this feature
  introduces, and User Story 2 fixes it.
- **One language, one audience.** Content is in English only, and no translation or regional
  variation is in scope.
- **Everything on the page is public.** There is no account, no login, no personalisation, and no
  visitor data of any kind is collected or stored.
- **Modern browsers only.** Current versions of the major desktop and mobile browsers are supported.
  No support is planned for browsers that are no longer receiving updates.
- **The old repository is unpublished, not redirected.** On 2026-09-03 the owner deleted the old
  repository's `CNAME`, set its Pages source to None, and archived it, so the bare
  `jburkinshaw.github.io` address now returns 404 rather than forwarding. A redirect page was
  considered and declined as not worth unarchiving for. This is why FR-018 is scoped to the project
  path, which GitHub forwards automatically once a custom domain is set. **To reverse:** unarchive
  the old repository, add a redirecting `index.html`, re-enable Pages, re-archive.

- **The link set stays small.** A handful of links is expected. Nothing here needs to work well at
  fifty.

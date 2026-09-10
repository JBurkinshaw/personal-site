import type { ImageMetadata } from "astro";
import { z } from "astro/zod";
import { Content, frontmatter, rawContent } from "../data/site.md";

/*
  Zod comes from astro/zod, a re-export of the zod Astro already depends on, so
  this costs no dependency and cannot skew from Astro's own copy.
*/
const required = z.string().trim().min(1, "must not be empty");

const siteSchema = z.object({
  name: required,
  role: required,
  location: required,
  /* A filename in src/assets/, so swapping the photo touches no code */
  photo: required,
  photoAlt: required,
  /* Optional: defaults to role and location, which is all it ever said */
  description: required.optional(),
  /*
    Array order is display order: the array already has one, and a second source
    of truth invites disagreement. Defaults to empty so removing the last link
    is a deletion rather than a build failure.
  */
  links: z
    .array(
      z.object({
        label: required,
        url: z.url({
          protocol: /^https$/,
          error:
            "must be an absolute https: URL, since an insecure link from a secure page is a needless downgrade",
        }),
      }),
    )
    .default([])
    .superRefine((links, ctx) => {
      const seen = new Set<string>();
      for (const [index, link] of links.entries()) {
        if (seen.has(link.url)) {
          ctx.addIssue({
            code: "custom",
            path: [index, "url"],
            message: `duplicates an earlier link to ${link.url}`,
          });
        }
        seen.add(link.url);
      }
    }),
});

const parsed = siteSchema.safeParse(frontmatter);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `src/data/site.md frontmatter is invalid:\n${problems}\n\n` +
      "Expected shape: specs/001-single-page-site/contracts/content-schema.md",
  );
}

const data = parsed.data;

/* "Joe Burkinshaw" describes nothing to someone who cannot see the image */
if (data.photoAlt.trim().toLowerCase() === data.name.trim().toLowerCase()) {
  throw new Error(
    "src/data/site.md photoAlt must describe the image, not repeat name. " +
      'Say what is in the picture, for example "Joe Burkinshaw smiling, forest behind him".',
  );
}

if (rawContent().trim().length === 0) {
  throw new Error(
    "src/data/site.md has an empty body. The bio is the prose below the frontmatter.",
  );
}

const images = import.meta.glob<{ default: ImageMetadata }>(
  "../assets/*.{jpg,jpeg,png,webp,avif}",
  { eager: true },
);

const photoModule = images[`../assets/${data.photo}`];

if (!photoModule) {
  const available = Object.keys(images)
    .map((path) => path.replace("../assets/", ""))
    .join(", ");
  throw new Error(
    `src/data/site.md photo "${data.photo}" is not in src/assets/. ` +
      `Available: ${available || "(none)"}`,
  );
}

export const profile = {
  name: data.name,
  role: data.role,
  location: data.location,
  /*
    Derived, so editing `location` moves the map link with it and there is no
    second field to keep in step. Google's documented Maps URLs form is used in
    preference to a place ID, which would rot.
  */
  locationMapUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(data.location),
  photo: photoModule.default,
  photoAlt: data.photoAlt,
  links: data.links,
};

const description = data.description ?? `${data.role} in ${data.location}.`;

/* Applies whether the description was written or derived */
if (description.length > 160) {
  throw new Error(
    `src/data/site.md description is ${description.length} characters. ` +
      "Search engines truncate beyond 160, so set a shorter `description` explicitly.",
  );
}

export const metadata = {
  /* The page title is the name; a second field would only duplicate it */
  title: data.name,
  description,
  previewImage: "/share-preview.jpg",
};

export { Content as Bio };

import type { ImageMetadata } from "astro";
import { z } from "astro/zod";
import { Content, frontmatter, rawContent } from "../data/site.md";

/*
  Zod comes from astro/zod, a re-export of the zod Astro already depends on, so
  this costs no dependency and cannot skew from Astro's own copy.

  The photo is named by filename only. Swapping it means dropping a file in
  src/assets/ and changing one word here, with no code to touch, per FR-011.
*/
const siteSchema = z.object({
  name: z.string().trim().min(1, "must not be empty"),
  title: z.string().trim().min(1, "must not be empty"),
  description: z
    .string()
    .trim()
    .min(1, "must not be empty")
    .max(
      160,
      "must be at most 160 characters so search engines do not truncate it",
    ),
  role: z.string().trim().min(1, "must not be empty"),
  location: z.string().trim().min(1, "must not be empty"),
  photo: z.string().trim().min(1, "must not be empty"),
  photoAlt: z.string().trim().min(1, "must not be empty"),
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

/*
  "Photo of Joe Burkinshaw" describes nothing to someone who cannot see it, so
  alternative text that merely repeats the name is rejected rather than allowed
  through (FR-002).
*/
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
    .map((k) => k.replace("../assets/", ""))
    .join(", ");
  throw new Error(
    `src/data/site.md photo "${data.photo}" is not in src/assets/. ` +
      `Available: ${available || "(none)"}`,
  );
}

/*
  Exported as separate entities so templates consume them distinctly, even
  though they share one frontmatter block. See data-model.md.
*/
export const profile = {
  name: data.name,
  role: data.role,
  location: data.location,
  photo: photoModule.default,
  photoAlt: data.photoAlt,
};

export const metadata = {
  title: data.title,
  description: data.description,
  previewImage: "/share-preview.jpg",
};

/* The bio prose, authored as the Markdown body rather than a frontmatter field. */
export { Content as Bio };

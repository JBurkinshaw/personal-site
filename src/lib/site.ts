import { z } from "astro/zod";
import { frontmatter } from "../data/site.md";

/*
  Stage 1 schema. Fields arrive with the stage that populates them, per
  data-model.md, so role, location, photo, photoAlt and links are absent here
  rather than optional. Adding them early would be schema for content that does
  not exist, which constitution Principle I prohibits.

  Zod comes from astro/zod, a re-export of the zod Astro already depends on, so
  this costs no dependency and cannot skew from Astro's own copy.
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
  provisional: z.boolean().optional(),
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
  Exported as separate entities so templates consume them distinctly, even
  though they share one frontmatter block. See data-model.md.
*/
export const profile = {
  name: data.name,
  provisional: data.provisional ?? false,
};

export const metadata = {
  title: data.title,
  description: data.description,
};

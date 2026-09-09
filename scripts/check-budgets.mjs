/*
  Build gates from plan.md, using Node builtins only.

  These exist because the failure mode constitution Principle VII is written
  against is a budget drifting quietly over months.

  Two different sizes are measured, and the distinction matters:

    Page weight     what a visitor actually downloads. HTML with its inlined
                    CSS, the favicon, and one variant per image, since a
                    browser picks a single entry from a <picture> rather than
                    downloading every fallback. This is the number plan.md caps
                    at 250KB and the number SC-002 cares about.

    Artefact size   everything in dist/, including the share-card image that
                    only crawlers fetch and the raster fallbacks that only
                    browsers without WebP fetch. Capped separately and more
                    loosely, so unused assets cannot grow without limit.
*/
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const DIST = "dist";

const LIMITS = {
  markupBytes: 20 * 1024, // HTML plus CSS, uncompressed
  imageBytes: 150 * 1024, // any single image
  pageWeightBytes: 250 * 1024, // what one visitor downloads
  artefactBytes: 400 * 1024, // everything in dist/
};

const SCRIPT_EXT = new Set([".js", ".mjs", ".cjs"]);
const MARKUP_EXT = new Set([".html", ".css"]);
const IMAGE_EXT = new Set([
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".gif",
  ".ico",
]);
const MODERN_FORMATS = [".avif", ".webp"];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push({ path, bytes: statSync(path).size });
  }
  return out;
}

let files;
try {
  files = walk(DIST);
} catch {
  console.error(
    `check-budgets: no ${DIST}/ directory. Run "npm run build" first.`,
  );
  process.exit(1);
}

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
const failures = [];
const byPath = new Map(files.map((f) => [f.path, f]));

const htmlText = files
  .filter((f) => extname(f.path) === ".html")
  .map((f) => readFileSync(f.path, "utf8"))
  .join("\n");

/* Zero client JavaScript. Principle II's whole guarantee is this number. */
const scripts = files.filter((f) => SCRIPT_EXT.has(extname(f.path)));
if (scripts.length > 0) {
  failures.push(
    "JavaScript emitted, budget is zero bytes:\n" +
      scripts.map((f) => `    ${f.path} (${kb(f.bytes)})`).join("\n"),
  );
}

/* HTML plus CSS, which with inlineStylesheets: 'always' is one request. */
const markup = files.filter((f) => MARKUP_EXT.has(extname(f.path)));
const markupBytes = markup.reduce((sum, f) => sum + f.bytes, 0);
if (markupBytes > LIMITS.markupBytes) {
  failures.push(
    `HTML plus CSS is ${kb(markupBytes)}, budget is ${kb(LIMITS.markupBytes)}`,
  );
}

/* No single image may be oversized, whether a visitor fetches it or not. */
const images = files.filter((f) => IMAGE_EXT.has(extname(f.path)));
for (const image of images) {
  if (image.bytes > LIMITS.imageBytes) {
    failures.push(
      `${image.path} is ${kb(image.bytes)}, per-image budget is ${kb(LIMITS.imageBytes)}`,
    );
  }
}

/*
  Page weight. Every asset the HTML references is collected from src and srcset,
  then grouped by image identity: Astro names variants
  <name>.<hash>_<variant>.<ext>, so stripping the final underscore segment and
  the extension identifies the source image. Within each group only the
  heaviest modern-format variant counts, because that is the worst case a
  current browser downloads. Assets referenced only by meta tags, such as the
  share card, are never requested by a visitor and are excluded.
*/
const referenced = new Set();
for (const match of htmlText.matchAll(/(?:src|srcset)="([^"]+)"/g)) {
  for (const candidate of match[1].split(",")) {
    const url = candidate.trim().split(/\s+/)[0];
    if (url.startsWith("/")) referenced.add(join(DIST, url));
  }
}

const groups = new Map();
let missingRefs = 0;
for (const path of referenced) {
  const file = byPath.get(path);
  if (!file) {
    missingRefs += 1;
    continue;
  }
  if (!IMAGE_EXT.has(extname(path))) continue;
  const identity = path.replace(/_[^_.]+\.[a-z0-9]+$/i, "");
  const group = groups.get(identity) ?? [];
  group.push(file);
  groups.set(identity, group);
}

let imageWeight = 0;
for (const [, variants] of groups) {
  const modern = variants.filter((v) =>
    MODERN_FORMATS.includes(extname(v.path)),
  );
  const considered = modern.length > 0 ? modern : variants;
  imageWeight += Math.max(...considered.map((v) => v.bytes));
}

const faviconBytes = files
  .filter((f) => f.path.includes("favicon"))
  .reduce((sum, f) => sum + f.bytes, 0);
const pageWeight = markupBytes + imageWeight + faviconBytes;

if (pageWeight > LIMITS.pageWeightBytes) {
  failures.push(
    `page weight is ${kb(pageWeight)}, budget is ${kb(LIMITS.pageWeightBytes)}`,
  );
}

/* Everything in dist/, unused assets included. */
const artefactBytes = files.reduce((sum, f) => sum + f.bytes, 0);
if (artefactBytes > LIMITS.artefactBytes) {
  failures.push(
    `total artefact size is ${kb(artefactBytes)}, budget is ${kb(LIMITS.artefactBytes)}`,
  );
}

/*
  FR-007: the light-dark() fallback must survive minification.

  The minifier treats a declaration overridden later in the same rule as dead
  and strips it, so a duplicate-declaration fallback exists in source and
  vanishes from the build. That happened once and stayed invisible until someone
  grepped dist/. This asserts the feature query is present in built output with
  all four colour tokens inside it.
*/
const COLOUR_TOKENS = [
  "--colour-paper",
  "--colour-ink",
  "--colour-secondary",
  "--colour-accent",
];
const styleText = files
  .filter((f) => MARKUP_EXT.has(extname(f.path)))
  .map((f) => readFileSync(f.path, "utf8"))
  .join("\n");

/* The balanced {...} block following `from`, or null if unbalanced. */
function blockAfter(text, from) {
  const open = text.indexOf("{", from);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    else if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return null;
}

const supportsAt = styleText.search(
  /@supports\s+not\s*\(\s*color\s*:\s*light-dark\(/,
);
let fallbackTokens = 0;
if (supportsAt === -1) {
  failures.push(
    "the light-dark() fallback is absent from built output. It must live in an " +
      "@supports not (color: light-dark(...)) block, because a duplicate declaration is stripped",
  );
} else {
  const block = blockAfter(styleText, supportsAt);
  const missing =
    block === null
      ? COLOUR_TOKENS
      : COLOUR_TOKENS.filter((t) => !block.includes(t));
  fallbackTokens = COLOUR_TOKENS.length - missing.length;
  if (missing.length > 0) {
    failures.push(`the light-dark() fallback omits ${missing.join(", ")}`);
  }
}

/*
  FR-010 and SC-007: zero requests to origins outside the owner's control.

  Only attributes that actually cause the browser to fetch something count:
  src, srcset, href on <link>, and url() or @import inside CSS. An <a href> is
  explicitly not one of them, because it fetches nothing until a visitor
  chooses to click it, and outbound links are the point of the page. xmlns
  values are namespace identifiers rather than resources, so they are stripped
  before scanning.
*/
const SCANNABLE = new Set([".html", ".css", ".svg", ".xml"]);
const ALLOWED_HOSTS = new Set(["joeburkinshaw.com", "www.joeburkinshaw.com"]);

const FETCH_PATTERNS = [
  /\b(?:src|srcset)\s*=\s*"([^"]+)"/gi,
  /<link\b[^>]*?\bhref\s*=\s*"([^"]+)"/gi,
  /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi,
  /@import\s+(?:url\()?\s*['"]([^'"]+)['"]/gi,
];

const external = [];
for (const file of files.filter((f) => SCANNABLE.has(extname(f.path)))) {
  const text = readFileSync(file.path, "utf8").replace(
    /xmlns(:[a-z]+)?="[^"]*"/g,
    "",
  );
  for (const pattern of FETCH_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      for (const candidate of match[1].split(",")) {
        const url = candidate.trim().split(/\s+/)[0];
        const host = url.match(/^(?:https?:)?\/\/([a-zA-Z0-9._-]+)/)?.[1];
        if (host && !ALLOWED_HOSTS.has(host)) {
          external.push(`${file.path} fetches ${url}`);
        }
      }
    }
  }
}
if (external.length > 0) {
  failures.push(
    "the page fetches resources from origins outside joeburkinshaw.com:\n" +
      external.map((e) => `    ${e}`).join("\n"),
  );
}

console.log("Budgets:");
console.log(`  JavaScript    ${scripts.length} files (budget 0)`);
console.log(
  `  HTML + CSS    ${kb(markupBytes)} (budget ${kb(LIMITS.markupBytes)})`,
);
console.log(
  `  Page weight   ${kb(pageWeight)} (budget ${kb(LIMITS.pageWeightBytes)}), markup plus ${groups.size} image(s) plus favicon`,
);
console.log(
  `  Artefacts     ${kb(artefactBytes)} (budget ${kb(LIMITS.artefactBytes)}), ${files.length} files including crawler and fallback assets`,
);
console.log(
  `  Largest image ${kb(Math.max(0, ...images.map((f) => f.bytes)))} (budget ${kb(LIMITS.imageBytes)} each)`,
);
console.log(
  `  Dark fallback ${fallbackTokens}/${COLOUR_TOKENS.length} colour tokens in @supports`,
);
console.log(
  `  Third-party   ${external.length} external origin references (budget 0)`,
);
if (missingRefs > 0) {
  console.log(
    `  Note          ${missingRefs} referenced path(s) not found in ${DIST}/`,
  );
}

if (failures.length > 0) {
  console.error("\ncheck-budgets: FAILED");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("\ncheck-budgets: all budgets held");

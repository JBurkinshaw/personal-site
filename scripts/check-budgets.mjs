/*
  Byte budgets from plan.md, enforced with Node builtins only.

  This exists because the failure mode constitution Principle VII is written
  against is a budget drifting quietly over months. The JavaScript check is the
  important one: Principle II's whole guarantee is a number that a single
  careless client: directive would silently break.
*/
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const DIST = "dist";

const LIMITS = {
  markupBytes: 20 * 1024, // HTML plus CSS, uncompressed
  imageBytes: 150 * 1024, // any single image
  totalBytes: 250 * 1024, // whole output
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

const scripts = files.filter((f) => SCRIPT_EXT.has(extname(f.path)));
if (scripts.length > 0) {
  failures.push(
    `JavaScript emitted, budget is zero bytes:\n` +
      scripts.map((f) => `    ${f.path} (${kb(f.bytes)})`).join("\n"),
  );
}

const markup = files.filter((f) => MARKUP_EXT.has(extname(f.path)));
const markupBytes = markup.reduce((sum, f) => sum + f.bytes, 0);
if (markupBytes > LIMITS.markupBytes) {
  failures.push(
    `HTML plus CSS is ${kb(markupBytes)}, budget is ${kb(LIMITS.markupBytes)}`,
  );
}

const images = files.filter((f) => IMAGE_EXT.has(extname(f.path)));
for (const image of images) {
  if (image.bytes > LIMITS.imageBytes) {
    failures.push(
      `${image.path} is ${kb(image.bytes)}, per-image budget is ${kb(LIMITS.imageBytes)}`,
    );
  }
}

const totalBytes = files.reduce((sum, f) => sum + f.bytes, 0);
if (totalBytes > LIMITS.totalBytes) {
  failures.push(
    `total output is ${kb(totalBytes)}, budget is ${kb(LIMITS.totalBytes)}`,
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
const STYLE_EXT = new Set([".html", ".css"]);
const COLOUR_TOKENS = [
  "--colour-paper",
  "--colour-ink",
  "--colour-secondary",
  "--colour-accent",
];

const styleText = files
  .filter((f) => STYLE_EXT.has(extname(f.path)))
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
  xmlns values are namespace identifiers rather than fetched resources, so they
  are stripped before scanning.
*/
const SCANNABLE = new Set([".html", ".css", ".svg", ".xml", ".txt", ".json"]);
const ALLOWED_HOSTS = new Set(["joeburkinshaw.com", "www.joeburkinshaw.com"]);

const external = [];
for (const file of files.filter((f) => SCANNABLE.has(extname(f.path)))) {
  const text = readFileSync(file.path, "utf8").replace(
    /xmlns(:[a-z]+)?="[^"]*"/g,
    "",
  );
  for (const match of text.matchAll(/(?:https?:)?\/\/([a-zA-Z0-9._-]+)/g)) {
    if (!ALLOWED_HOSTS.has(match[1]))
      external.push(`${file.path} references ${match[0]}`);
  }
}
if (external.length > 0) {
  failures.push(
    "references to origins outside joeburkinshaw.com:\n" +
      external.map((e) => `    ${e}`).join("\n"),
  );
}

console.log("Budgets:");
console.log(`  JavaScript   ${scripts.length} files (budget 0)`);
console.log(
  `  HTML + CSS   ${kb(markupBytes)} (budget ${kb(LIMITS.markupBytes)})`,
);
console.log(
  `  Images       ${images.length} files, largest ${kb(Math.max(0, ...images.map((f) => f.bytes)))} (budget ${kb(LIMITS.imageBytes)} each)`,
);
console.log(
  `  Total        ${kb(totalBytes)} (budget ${kb(LIMITS.totalBytes)})`,
);

console.log(
  `  Dark fallback ${fallbackTokens}/${COLOUR_TOKENS.length} colour tokens in @supports`,
);
console.log(
  `  Third-party  ${external.length} external origin references (budget 0)`,
);

if (failures.length > 0) {
  console.error("\ncheck-budgets: FAILED");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("\ncheck-budgets: all budgets held");

/*
  Byte budgets from plan.md, enforced with Node builtins only.

  This exists because the failure mode constitution Principle VII is written
  against is a budget drifting quietly over months. The JavaScript check is the
  important one: Principle II's whole guarantee is a number that a single
  careless client: directive would silently break.
*/
import { readdirSync, statSync } from "node:fs";
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

if (failures.length > 0) {
  console.error("\ncheck-budgets: FAILED");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("\ncheck-budgets: all budgets held");

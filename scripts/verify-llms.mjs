#!/usr/bin/env node
/**
 * Checks the two files in `landing` that list these pages by hand against the
 * pages that exist.
 *
 * The llmstxt.org convention is only honoured at the ROOT of a host, and these
 * docs are a path route under landing's apex — so `/llms.txt` and
 * `/llms-full.txt` are served by `landing`, listing pages that live here. There
 * is no shared package across the two apps and no import between them: the link
 * list in `landing/src/app/llms.txt/route.ts` is a hand-maintained mirror of
 * this app's routes, and the root AGENTS.md records that as a coupling nobody
 * gets warned about.
 *
 * **The audience is the one that cannot report the problem.** A link that
 * 404s here is invisible in a browser, in a build and in anybody's analytics,
 * because the readers affected are assistants and they do not file bugs.
 *
 * The two directions are deliberately NOT symmetrical, and that asymmetry is
 * the file's own stated policy rather than this script's opinion:
 *
 * - **A link to a page that does not exist FAILS.** That is a dead end, and
 *   it is what a rename leaves behind.
 * - **A page with no link is REPORTED, not failed.** `llms.txt` is
 *   hand-written and curated on purpose — the whole value is that a model can
 *   read the lot in one go — and its own header says to prefer leaving a page
 *   out to padding the list. So the unlisted ones are printed to be looked at
 *   rather than treated as a fault. Set `--strict` to fail on them, which is
 *   worth doing when you have just added a section.
 *
 * `llms-full.txt` is GENERATED (`npm run gen:llms-full`), so a page missing
 * from it means the file is stale rather than that somebody forgot — a
 * different instruction, and the message says so.
 *
 * Run: `node scripts/verify-llms.mjs [--strict]`
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const docs = join(here, "..");
const landing = join(docs, "..", "landing");
const strict = process.argv.includes("--strict");

const problems = [];
const notes = [];

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (err) {
    problems.push(`Could not read ${path}: ${err.message}`);
    return "";
  }
}

// --- what pages there actually are ----------------------------------------
//
// Read off the filesystem rather than out of nav.ts, because the filesystem is
// what Next.js routes from and is therefore the only answer that cannot itself
// be out of date.

const appDir = join(docs, "src", "app");

/** Every routable page under `src/app`, as its URL path below /docs. */
function pages(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      // A leading underscore opts a folder out of routing, and a bracketed
      // segment is a dynamic route with no single URL to list. Neither is a
      // page anybody can link to by name.
      if (entry.name.startsWith("_") || entry.name.startsWith("[")) continue;
      found.push(...pages(path));
    } else if (entry.name === "page.mdx" || entry.name === "page.tsx") {
      const segments = relative(appDir, dir)
        .split(sep)
        // A route group is organisation, not URL.
        .filter((s) => s && !(s.startsWith("(") && s.endsWith(")")));
      found.push(segments.join("/"));
    }
  }
  return found;
}

/**
 * The API reference is one dynamic route over the OpenAPI description, so the
 * scan above sees `[operation]` and rightly skips it — but every endpoint page
 * it stands for is a real URL that llms.txt links by name. They come from the
 * same place the route's own `generateStaticParams` gets them, which is what
 * keeps this from being a third hand-maintained list of the same thing.
 */
function apiReferencePages() {
  const spec = JSON.parse(read(join(docs, "src", "openapi.json")) || "{}");
  const slug = (id) => id.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  const out = [];
  for (const path of Object.values(spec.paths ?? {})) {
    for (const op of Object.values(path ?? {})) {
      if (op && typeof op === "object" && op.operationId) out.push(`api-reference/${slug(op.operationId)}`);
    }
  }
  return out;
}

const slugs = [...new Set([...pages(appDir), ...apiReferencePages()])].sort();
if (slugs.length < 10) {
  problems.push(`Found only ${slugs.length} pages under src/app — that cannot be right.`);
}

// --- the hand-written list ------------------------------------------------

const llmsTxt = read(join(landing, "src", "app", "llms.txt", "route.ts"));

/**
 * `${SITE_URL}/docs/rp-engine/vehicles` → `rp-engine/vehicles`, and
 * `${SITE_URL}/docs` → "".
 *
 * The file is TypeScript holding a template literal, so the URLs arrive with
 * the origin still an interpolation. Matching on the `/docs` prefix rather
 * than building the whole URL keeps this from caring what SITE_URL is.
 */
const listed = new Set();
for (const match of llmsTxt.matchAll(/\$\{SITE_URL\}\/docs((?:\/[a-z0-9-]+)*)(?=[)\s])/g)) {
  listed.add(match[1].replace(/^\//, ""));
}
if (listed.size === 0) {
  problems.push("Read no /docs links out of landing/src/app/llms.txt/route.ts");
}

for (const slug of listed) {
  if (!slugs.includes(slug)) {
    problems.push(
      `llms.txt links /docs/${slug}, which is not a page in this app.\n` +
        "  A wrong link is worse than a missing one: it is a dead end rather than a gap,\n" +
        "  and it is what a renamed page leaves behind.",
    );
  }
}

const unlisted = slugs.filter((slug) => !listed.has(slug));
if (unlisted.length > 0) {
  const message =
    `${unlisted.length} pages have no line in llms.txt:\n` +
    unlisted.map((s) => `      /docs/${s || ""}`).join("\n") +
    "\n  That list is curated on purpose, so this is a prompt rather than a fault —\n" +
    "  but a whole section missing from it is a section assistants never learn about.";
  (strict ? problems : notes).push(message);
}

// --- the generated one ----------------------------------------------------

const full = read(join(landing, "public", "llms-full.txt"));
// Only the pages llms.txt itself points at: llms-full is the concatenation of
// what the summary advertises, not of the whole tree.
const stale = [...listed].filter((slug) => slug && !full.includes(`/docs/${slug}`));
if (stale.length > 0) {
  problems.push(
    `landing/public/llms-full.txt does not mention: ${stale.map((s) => `/docs/${s}`).join(", ")}.\n` +
      "  That file is generated rather than written — run `npm run gen:llms-full` here\n" +
      "  and commit what it writes, rather than editing it by hand.",
  );
}

// --- report ---------------------------------------------------------------

for (const note of notes) console.log(`  note: ${note}\n`);

if (problems.length > 0) {
  console.error("The docs and landing's lists of them disagree:\n");
  for (const problem of problems) console.error(`  - ${problem}\n`);
  process.exit(1);
}

console.log(
  `Every link resolves: ${listed.size} listed of ${slugs.length} pages, ` +
    "and llms-full.txt covers the listed ones.",
);

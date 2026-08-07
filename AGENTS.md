# What this is

The product documentation site, served at **resourcepack.ai/docs**. Next.js +
MDX on Cloudflare Workers, same shape as `../landing`: no auth, no database,
no secrets, no bindings at all — every page is prerendered static content.

It documents `studio`, both plugins and the test server, but has **no code
dependency on any of them**. Nothing here imports from a sibling directory.
When behaviour in `studio` or `user-plugin` changes in a way a user would
notice, the matching page here needs updating by hand — nothing will warn you.

# Setup

```bash
npm install
npm run dev     # http://localhost:3001
```

That's the whole thing. No `.env`, no `wrangler d1 migrations apply`, no
`cf:typegen` (there are no bindings to generate types for — if you ever add
one, add the `cf:typegen` step back to this list).

Port 3001, not 3000, so it can run alongside `studio` or `landing`.

# Working on this repo

```bash
npx tsc --noEmit        # typecheck
npm run lint            # eslint — the react-hooks rules are strict, as in studio
```

Both are cheap; run them before considering a change done. `npm run build` is
only worth running when you've touched the MDX pipeline or the Cloudflare
config.

## If Turbopack panics, delete `.next`

Turbopack keeps a persistent cache in `.next/dev/cache`, and it does **not**
invalidate on a `next.config.ts` change or reconcile itself after a dev server
is killed mid-write. Two ways that shows up, both as a red `FATAL` plus a
`next-panic-*.log` in your temp dir:

```
Resource path "docs/src/app/(docs)/page.mdx" needs to be on project filesystem ""
Failed to open SST file ...\.next\dev\cache\turbopack\...\00000248.sst
```

Neither is a problem with the app — pages still serve 200, but HMR is dead
until you restart. `rm -rf .next` and start again; both go away and stay away.

The reliable way to cause it is **two `next dev` servers on the same
directory** (they share `.next` and corrupt each other's cache). Next only
notices the second one late — `--port 3005` doesn't give you a second safe
instance. Kill the first.

## The build must be Turbopack — do NOT add `--webpack`

`landing` and `studio` both build with `next build --webpack`. This app
**can't**, and the failure is not obvious:

```
You are attempting to export "metadata" from a component marked with
"use client", which is disallowed.
```

Every `.mdx` page fails that check under the webpack builder on Next 16.2.9,
including one with no client components anywhere in its import graph (this was
bisected — it's not our `mdx-components.tsx`, and it's not `@mdx-js/react`).
`next build` with Turbopack compiles the identical pages without complaint,
which is why `package.json`'s `build` script is a bare `next build`.

OpenNext shells out to `npm run build`, so the Cloudflare deploy inherits
this automatically. If someone "fixes" the inconsistency with the sibling apps
by adding `--webpack`, every deploy breaks.

## `@opennextjs/cloudflare` is patched for Windows builds

`patches/@opennextjs+cloudflare+1.20.1.patch`, applied by `patch-package` on
`postinstall`. Don't drop it, and if you bump the dependency, regenerate it
(`npx patch-package @opennextjs/cloudflare`) — the filename carries the version
and a stale patch fails loudly on install.

OpenNext's Turbopack plugin finds server chunks with
`.includes(".next/server/chunks/")` — forward slashes only. On Windows nothing
matches, so it emits **empty** `requireChunk`/`loadWasmChunk` switches. The
build passes, `wrangler deploy` reports success, and then every SSR route 500s
with `ChunkLoadError: Failed to load chunk server/chunks/ssr/[root-of-the-server]__*.js`.
The patch normalizes separators in the four places that match or emit those
paths (they end up inside `require(...)` string literals, so they must be POSIX
in the *output* too, not just for comparison).

This only bites here because `docs` is the one app that must build with
Turbopack — see below. Still unfixed in 1.20.2. To check a build before
shipping it:

```bash
grep -c 'case "server/chunks' '.open-next/server-functions/default/.next/server/chunks/ssr/[turbopack]_runtime.js'
```

Zero means the patch didn't apply and the deploy would be dead on arrival.
Building in WSL avoids the whole problem, if you'd rather do that.

## `@opennextjs/cloudflare` is pinned exactly

`1.20.1`, not a caret range. `1.20.2` tightened its peer dependency to
`next >=16.2.11` and won't install against the `next@16.2.9` all three
Next apps in this repo are on. Bump it when studio and landing move.

# Content pipeline

A page is `src/app/(docs)/<path>/page.mdx`, routed by folder like any other
Next page. There's no CMS and no runtime markdown compilation — MDX is
compiled at build time by `@next/mdx`.

**Adding a page is two steps, and the second one is not optional:**

1. create `src/app/(docs)/<path>/page.mdx` with a `metadata` export and an `h1`
2. add an entry to `src/lib/nav.ts`

`nav.ts` is the single source of truth for the sidebar, the ⌘K search index,
the prev/next pager and the group label above each page title. A page that
exists but isn't listed is reachable by URL and invisible everywhere else.

The components a page can use without importing anything — `Callout`, `Card`,
`CardGroup`, `Steps`, `Step` — are registered in `src/mdx-components.tsx`;
read that file for the props. `Card`'s `icon` comes from the fixed set in
`src/components/mdx/icons.tsx`, which is deliberately small: widen it by
adding a name there, not by letting `Card` take arbitrary nodes.

There used to be a `/reference/writing-docs` page demoing all of it. It was
removed — this is a product doc site, and a page about how to write the pages
is for us, not for users.

## Things that will bite you

- **remark/rehype plugins are named as strings** in `next.config.ts`, not
  imported. Turbopack runs the MDX pipeline in Rust and can't take JS function
  references — importing them normally works for a webpack build and breaks
  `npm run dev`. Options must stay JSON-serializable for the same reason.
- **`#docs-article` is load-bearing.** `TableOfContents` scans that element's
  DOM for `h2[id]`/`h3[id]` rather than reading a build-time heading export.
  Renaming the id silently empties every "On this page".
- **Heading ids come from `rehype-slug`.** Drop it and every anchor link and
  the whole TOC go with it.
- **Code block markup is generated**, so it's styled in `globals.css` rather
  than `mdx-components.tsx` — `figure[data-rehype-pretty-code-figure]`,
  `[data-line]`, `[data-highlighted-line]`. `keepBackground: false` strips
  Shiki's own background so blocks sit on our surface colour.
- **Components must be registered** in `src/mdx-components.tsx` to be usable
  in a page without an import. That's deliberate: content files stay content.
- **`eslint.config.mjs` ignores `.open-next/**` and `.wrangler/**`**, which
  `eslint-config-next` does not. Without those two lines `npm run lint` is
  clean until the first Cloudflare build, then reports ~7000 problems in
  bundled Next server code. (`landing` and `studio` have the same gap.)

# Design

Dark-only, like studio (`<html>` is permanently `.dark`). There's no theme
toggle rather than a half-built one.

`src/app/globals.css` **duplicates studio's design tokens** — same warm-dark
surfaces (`#1b1b18` family), same `--primary: #4d8dff`, same
`--brand-ai-blue: #3670f8` for the `.ai` in the wordmark, same Onest +
IBM Plex Mono pairing. As with `landing`, this is a real copy and not a shared
package: if studio's palette moves, move these too, because nothing will warn
you. It's a trimmed copy — only the tokens this site uses, none of studio's
animation keyframes.

No `@tailwindcss/typography`. Prose styling lives in `mdx-components.tsx`
against our own tokens; `prose` classes are a stranger's design system and
fight them.

# Deployment

Preferred: from the repo root, `npm run deploy -- docs prod` (see
`../AGENTS.md`). Same `opennextjs-cloudflare` shape as landing and studio.

No staging environment, same reasoning as `landing`: nothing here is
auth-gated or data-touching, so there's nothing to stage. `wrangler.jsonc` has
no `env.staging` block — don't add one without a real reason.

## This app lives under a basePath

`next.config.ts` sets `basePath: "/docs"`, because the public address is
resourcepack.ai/docs rather than a subdomain of its own — a subdirectory so
the docs' search authority lands on the domain that sells something. It is
still a wholly separate Worker with its own deploy; `landing` has no idea
this exists.

The mechanism is a Cloudflare **path route**, `resourcepack.ai/docs*`, and
the thing that makes it safe is that Cloudflare runs a route *before* a
Custom Domain on the same hostname. So `landing` keeps its custom domain on
the apex, unchanged and unreleased — there is **no** release-then-claim
ordering here, unlike the landing/studio handover. Deploy this app whenever;
nothing else needs redeploying with it.

What that costs you when working here:

- **`zone_name` is mandatory** on the path route in `wrangler.jsonc`. A path
  route can't infer its zone the way a custom domain does.
- **`next/link` hrefs and `_next` assets get the prefix for free**, which is
  why nothing in `nav.ts` or the `.mdx` Cards changed. Nothing else does —
  **including `next/image`'s `src`**, which is emitted verbatim. This bit
  twice, in the metadata favicon and the header mark, both of which asked
  for `/logo.svg` and so resolved against *landing's* Worker. Landing serves
  a byte-identical logo, so both looked correct in production while pointing
  at the wrong app; the only symptom was a 404 per page load in local dev,
  where nothing serves the apex.
  Use `asset()` from `src/lib/base-path.ts` for any literal path, and build
  absolute URLs (`sitemap.ts`, `metadataBase`) from its `BASE_PATH` rather
  than typing `/docs` again.
- **There is no `robots.ts` here, on purpose.** A robots.txt is only honoured
  at the root of a host and this app no longer owns one; `landing`'s
  `robots.ts` lists this app's sitemap. If the docs move again, that line
  moves too.

**`docs.resourcepack.ai` is gone**, and isn't coming back. It was this app's
original home, kept for a few hours as a permanent redirect before being
retired outright: the product was still pre-launch (`WAITLIST_MODE`), so
nothing on the public internet linked to it, and the only references anywhere
were `server-plugin`'s in-game menu — updated in the same change. A redirect
preserving zero equity is ceremony. Had this happened after launch the answer
would have been the opposite, and the redirect would still be here.

The practical consequence: this app has exactly **one** route, and any link
to the old subdomain is dead rather than redirected. If one turns up in an
old Discord message, fix the message.

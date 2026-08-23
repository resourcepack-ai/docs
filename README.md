# ResourcePack AI — documentation

The source of **[resourcepack.ai/docs](https://resourcepack.ai/docs)**: the
product documentation and the API reference for
[ResourcePack AI](https://resourcepack.ai), an AI-assisted editor for building
Minecraft resource packs.

This repository is public so that anyone who spots a mistake in the docs can
fix it. A typo, a step that no longer matches the app, a code sample that
doesn't run — open a pull request against the page and we'll take it.

## Running it

```bash
npm install
npm run dev        # http://localhost:3001
```

That's the whole setup. There is no `.env`, no database and no API key: every
page is static content compiled at build time.

```bash
npx tsc --noEmit   # typecheck
npm run lint
```

Both are quick and worth running before you open a pull request. A full
`npm run build` is only necessary if you've touched the MDX pipeline or the
Cloudflare config.

> **The build must use Turbopack.** Don't add `--webpack` to the `build`
> script — every `.mdx` page fails the webpack builder's "use client" metadata
> check, and the deploy inherits the same script. `AGENTS.md` has the detail.

## Writing a page

A page is `src/app/(docs)/<path>/page.mdx`, routed by folder like any other
Next.js page. It needs a `metadata` export and an `h1`, and it needs an entry
in `src/lib/nav.ts` — that file is the single source of truth for the sidebar,
the ⌘K search index and the prev/next pager, so a page missing from it is
reachable by URL and invisible everywhere else.

The components available inside a page without importing anything — `Callout`,
`Card`, `CardGroup`, `Steps`, `Step` — are registered in
`src/mdx-components.tsx`.

The **API reference** under `/api-reference` is generated from
`src/openapi.json` rather than written by hand. Fixes to an endpoint's
description belong upstream in the app that emits that spec, not here; the
prose guides beside it are ordinary MDX pages.

`AGENTS.md` is the full working guide to this app — the content pipeline, the
things that will bite you, and how it deploys.

## A note on layout

ResourcePack AI is developed in a private monorepo alongside the app, the
plugins and the rest of the infrastructure, and this repository is a mirror of
one directory of it, kept in sync commit for commit. Everything here builds and
runs on its own, but `AGENTS.md` occasionally refers to a sibling directory
(`../landing`, `../studio`) that only exists in that monorepo — those
references are context, not a missing dependency. The one script that reaches
across, `npm run gen:llms-full`, writes into `../landing` and is ours to run.

Pull requests are merged into the monorepo and flow back out here, so a merged
change may land as a commit with a different hash. It's still your commit and
your authorship.

## Licence

MIT — see [LICENSE](LICENSE).

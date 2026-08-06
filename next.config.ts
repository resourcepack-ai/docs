import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app serves at resourcepack.ai/docs, not on its own domain — a
  // subdirectory so its search authority accrues to the domain that sells
  // something, instead of pooling on a hostname that never will. It's still
  // its own Worker and its own deploy; a Cloudflare route
  // (`resourcepack.ai/docs*`, see wrangler.jsonc) runs in front of landing's
  // custom domain and hands those paths here.
  //
  // Every internal href in `nav.ts` and the .mdx Cards stays root-relative —
  // next/link prepends this, so none of them changed.
  basePath: "/docs",
  // .mdx files under src/app are real pages — that's the whole content
  // pipeline here, no CMS and no runtime markdown compilation.
  pageExtensions: ["ts", "tsx", "mdx"],
  // The old home. Kept as a permanent redirect rather than switched off:
  // links to docs.resourcepack.ai exist in the wild (Discord, the plugin
  // pages) and a 301 is what moves their search equity to the new URLs
  // instead of stranding it. `basePath: false` is required — without it Next
  // prefixes the source with /docs and this never matches, since requests to
  // the old host don't carry it.
  async redirects() {
    return [
      {
        source: "/:path*",
        basePath: false,
        has: [{ type: "host", value: "docs.resourcepack.ai" }],
        destination: "https://resourcepack.ai/docs/:path*",
        permanent: true,
      },
    ];
  },
  // This app is its own workspace. Without this, Turbopack sees the
  // monorepo root's package-lock.json alongside ours, picks the root, and
  // warns on every `npm run dev`.
  turbopack: { root: import.meta.dirname },
};

const withMDX = createMDX({
  options: {
    // Plugins are named as STRINGS on purpose: Turbopack (the `next dev`
    // default) runs the MDX pipeline in Rust and can't accept JS function
    // references, only serializable options. Importing these normally
    // would work for `next build --webpack` and break `npm run dev`.
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [
      // Heading ids — the "On this page" rail and every #anchor link
      // depend on these existing.
      "rehype-slug",
      // Build-time syntax highlighting (Shiki). Zero client JS; we
      // override the theme's background in globals.css so code blocks sit
      // on our own surface colour instead of the theme's near-black.
      ["rehype-pretty-code", { theme: "github-dark-default", keepBackground: false }],
    ],
  },
});

export default withMDX(nextConfig);

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev({
  remoteBindings: false,
});

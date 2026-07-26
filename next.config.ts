import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // .mdx files under src/app are real pages — that's the whole content
  // pipeline here, no CMS and no runtime markdown compilation.
  pageExtensions: ["ts", "tsx", "mdx"],
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

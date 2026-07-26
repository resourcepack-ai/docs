/**
 * The single source of truth for the docs navigation.
 *
 * Adding a page is two steps and only two steps:
 *   1. create `src/app/(docs)/<segment>/page.mdx`
 *   2. add an entry here
 *
 * Everything else — the sidebar, the ⌘K search index, the prev/next pager
 * at the foot of each page, the page <title> — is derived from this list.
 * A page that exists but isn't listed here is reachable by URL but
 * invisible; that's a bug, not a feature.
 */

export type NavItem = {
  title: string;
  href: string;
  /** Shown under the title in search results. Keep it to one line. */
  description?: string;
  /** Extra search terms that don't belong in the visible title. */
  keywords?: string[];
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const nav: NavGroup[] = [
  {
    title: "Getting started",
    items: [
      {
        title: "Introduction",
        href: "/",
        description: "What ResourcePack AI is and how the pieces fit together.",
        keywords: ["overview", "about", "home"],
      },
      {
        title: "Quickstart",
        href: "/quickstart",
        description: "From an empty pack to a block you can stand next to.",
        keywords: ["start", "first pack", "tutorial"],
      },
      {
        title: "Packs and assets",
        href: "/packs",
        description: "What a pack holds, and how it becomes a real Minecraft pack.",
        keywords: ["export", "zip", "mcpack", "bedrock", "assets", "download"],
      },
    ],
  },
  {
    title: "Building",
    items: [
      {
        title: "Generating with AI",
        href: "/generating",
        description: "Writing prompts that produce something worth editing.",
        keywords: ["ai", "claude", "prompt", "iterate", "generate"],
      },
      {
        title: "Texture editor",
        href: "/editors/textures",
        description: "The pixel editor: tools, layers, resolution.",
        keywords: ["pixel", "paint", "draw", "png", "layers", "16x16"],
      },
      {
        title: "Model editor",
        href: "/editors/models",
        description: "Cubes, bones, painting, and how a model gets in-game.",
        keywords: ["3d", "blockbench", "cube", "element", "uv", "display", "bones"],
      },
      {
        title: "Animations",
        href: "/editors/animations",
        description: "Keyframes in the editor, playback on your server.",
        keywords: ["animate", "keyframe", "trigger", "rig", "loop", "right click"],
      },
      {
        title: "Custom fonts",
        href: "/editors/fonts",
        description: "Bitmap glyphs for chat, signs and books.",
        keywords: ["font", "glyph", "emoji", "icon", "unicode", "pua"],
      },
    ],
  },
  {
    title: "Testing in Minecraft",
    items: [
      {
        title: "Our test server",
        href: "/testing/test-server",
        description: "play.resourcepack.ai — a lobby and a private world of your own.",
        keywords: ["sandbox", "lobby", "portal", "play", "world"],
      },
      {
        title: "Your own server",
        href: "/testing/your-server",
        description: "Install the plugin, run /link, push packs to your players.",
        keywords: ["plugin", "spigot", "paper", "sync", "pairing code", "link"],
      },
      {
        title: "Placing models in-game",
        href: "/testing/placing-models",
        description: "How a model item becomes a placed, animated object.",
        keywords: ["give", "custom model data", "item display", "place", "punch"],
      },
    ],
  },
  {
    title: "Reference",
    items: [
      {
        title: "Writing docs",
        href: "/reference/writing-docs",
        description: "Every component available inside an MDX page, with source.",
        keywords: ["mdx", "components", "callout", "steps", "cards", "style guide"],
      },
    ],
  },
];

/** Every page in sidebar order — the order the pager walks. */
export const flatNav: NavItem[] = nav.flatMap((group) => group.items);

export function findNavItem(href: string): NavItem | undefined {
  return flatNav.find((item) => item.href === href);
}

/** The previous/next page relative to `href`, for the footer pager. */
export function navNeighbours(href: string): {
  previous?: NavItem;
  next?: NavItem;
} {
  const index = flatNav.findIndex((item) => item.href === href);
  if (index === -1) return {};
  return {
    previous: index > 0 ? flatNav[index - 1] : undefined,
    next: index < flatNav.length - 1 ? flatNav[index + 1] : undefined,
  };
}

/** The group a page belongs to — shown as the eyebrow above its title. */
export function navGroupOf(href: string): string | undefined {
  return nav.find((group) => group.items.some((item) => item.href === href))?.title;
}

/** Off-site links in the top bar. */
export const externalLinks = [
  { title: "Studio", href: "https://studio.resourcepack.ai" },
  { title: "Discord", href: "https://resourcepack.ai/discord" },
];

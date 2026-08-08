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
    ],
  },
  {
    title: "Building",
    items: [
      {
        title: "Generating with AI",
        href: "/generating",
        description: "Writing prompts that produce something worth editing.",
        keywords: [
          "ai",
          "builder",
          "prompt",
          "iterate",
          "generate",
          "notify",
          "notification",
          "email",
          "discord",
          "dm",
        ],
      },
      {
        title: "Models",
        href: "/models",
        description: "Cubes, bones, painting, and how a model gets in-game.",
        keywords: [
          "3d",
          "blockbench",
          "cube",
          "element",
          "uv",
          "display",
          "bones",
          "carrier",
          "give",
          "custom model data",
        ],
      },
      {
        title: "Animations",
        href: "/animations",
        description: "Keyframes in the editor, playback on your server.",
        keywords: ["animate", "keyframe", "trigger", "rig", "loop", "right click"],
      },
      {
        title: "Blocks",
        href: "/blocks",
        description: "The pixel editor, and what a block texture becomes in a pack.",
        keywords: [
          "pixel",
          "paint",
          "draw",
          "png",
          "layers",
          "16x16",
          "texture",
          "override",
          "resolution",
          "render type",
        ],
      },
      {
        title: "Items",
        href: "/items",
        description: "Sprites that reach a player's hand, hotbar and inventory.",
        keywords: ["sprite", "icon", "hotbar", "inventory", "itemstack", "item"],
      },
      {
        title: "GUIs",
        href: "/guis",
        description: "Reskinning a screen, and what a pack can't change about one.",
        keywords: ["gui", "screen", "inventory", "menu", "chest", "draw-only"],
      },
      {
        title: "Icons",
        href: "/icons",
        description: "Bitmap glyphs for chat, signs and books.",
        keywords: [
          "font",
          "glyph",
          "emoji",
          "icon",
          "unicode",
          "pua",
          "codepoint",
          "tellraw",
        ],
      },
      {
        title: "Sounds",
        href: "/sounds",
        description: "Replacing a vanilla noise, or adding a new event you play by command.",
        keywords: [
          "sound",
          "audio",
          "ogg",
          "vorbis",
          "playsound",
          "sounds.json",
          "event",
          "category",
        ],
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
      // "Your own server" is held back from launch (owner call, 2026-08-08).
      // The page itself is parked at app/(docs)/testing/_your-server — the
      // underscore keeps Next from routing it. To bring it back: rename the
      // folder, restore this entry, and re-add the links the removal commit
      // lists.
      // {
      //   title: "Your own server",
      //   href: "/testing/your-server",
      //   description: "Install the plugin, run /link, push packs to your players.",
      //   keywords: ["plugin", "spigot", "paper", "sync", "pairing code", "link"],
      // },
    ],
  },
  {
    title: "Resource packs",
    items: [
      {
        title: "Exporting",
        href: "/exporting",
        description: "The two exports, what lands in the file, and how to install it.",
        keywords: ["export", "download", "zip", "mcpack", "version"],
      },
      {
        title: "Moving assets between packs",
        href: "/moving-assets",
        description: "Copy or move assets to another pack, and what gets rebuilt.",
        keywords: ["move", "copy", "transfer", "another pack", "duplicate"],
      },
      {
        title: "Collaborators",
        href: "/collaborators",
        description: "Let other people work on a pack, and decide how much of it.",
        keywords: [
          "member",
          "members",
          "collaborator",
          "sub user",
          "subuser",
          "invite",
          "invitation",
          "team",
          "share",
          "permission",
          "access",
          "editor",
          "viewer",
        ],
      },
    ],
  },
];

/** Every page in sidebar order — the order the pager walks. */
export const flatNav: NavItem[] = nav.flatMap((group) => group.items);

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

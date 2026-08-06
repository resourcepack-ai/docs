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
        keywords: ["ai", "builder", "prompt", "iterate", "generate"],
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
        title: "Custom icons",
        href: "/editors/icons",
        description: "Bitmap glyphs for chat, signs and books.",
        keywords: ["font", "glyph", "emoji", "icon", "unicode", "pua"],
      },
      {
        title: "Generation notifications",
        href: "/notifications",
        description: "Get told when a model finishes, without watching the tab.",
        keywords: ["notify", "notification", "email", "discord", "dm", "bot", "ping", "alert"],
      },
      {
        title: "Pack members",
        href: "/members",
        description: "Let other people work on a pack, and decide how much of it.",
        keywords: [
          "member",
          "members",
          "sub user",
          "subuser",
          "invite",
          "invitation",
          "collaborator",
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
    title: "Exporting",
    items: [
      {
        title: "Exporting a pack",
        href: "/exporting",
        description: "The three exports, the version picker, and what's in the file.",
        keywords: ["export", "download", "zip", "mcpack", "version"],
      },
      {
        title: "Models",
        href: "/exporting/models",
        description: "Carriers, give commands, and placing an exported model.",
        keywords: [
          "carrier",
          "give",
          "custom model data",
          "display",
          "animation",
          "keyframe",
        ],
      },
      {
        title: "Blocks",
        href: "/exporting/blocks",
        description: "What a block texture becomes in an exported pack.",
        keywords: ["texture", "png", "override", "resolution", "render type"],
      },
      {
        title: "Items",
        href: "/exporting/items",
        description: "How an item sprite reaches a player's hand and inventory.",
        keywords: ["sprite", "icon", "hotbar", "inventory", "itemstack"],
      },
      {
        title: "GUIs",
        href: "/exporting/guis",
        description: "What a GUI texture replaces, and what a pack can't change.",
        keywords: ["gui", "screen", "inventory", "menu", "chest", "draw-only"],
      },
      {
        title: "Icons",
        href: "/exporting/icons",
        description: "Typing an exported glyph into chat, signs and books.",
        keywords: ["font", "glyph", "codepoint", "unicode", "pua", "tellraw"],
      },
      {
        title: "Sounds",
        href: "/exporting/sounds",
        description: "Replacing a vanilla noise, or adding a new event you play by command.",
        keywords: ["sound", "audio", "ogg", "vorbis", "playsound", "sounds.json", "event", "category"],
      },
      {
        title: "Bedrock and Geyser",
        href: "/exporting/bedrock",
        description: "What converts into the .mcpack, and how Geyser players get it.",
        keywords: ["mcpack", "bedrock", "geyser", "convert", "transfer"],
      },
    ],
  },
  {
    title: "For developers",
    items: [
      {
        title: "Pack layout reference",
        href: "/developers/pack-layout",
        description: "The file tree of an exported pack, directory by directory.",
        keywords: ["files", "tree", "pack.mcmeta", "pack format", "assets"],
      },
      {
        title: "Give commands and carriers",
        href: "/developers/give-commands",
        description: "Every carrier kind against every Minecraft command era.",
        keywords: ["give", "nbt", "components", "block state", "custom model data"],
      },
      {
        title: "Sample code",
        href: "/developers/sample-code",
        description: "Paper and Spigot snippets that don't depend on our plugin.",
        keywords: ["java", "spigot", "paper", "api", "itemstack", "snippet", "code"],
      },
      {
        title: "Example packs",
        href: "/developers/example-packs",
        description: "Downloadable packs that each demonstrate one thing.",
        keywords: ["sample", "example", "demo", "download"],
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

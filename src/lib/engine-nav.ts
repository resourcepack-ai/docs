/**
 * RP Engine's own navigation.
 *
 * Deliberately NOT part of `lib/nav.ts`. RP Engine is a plugin you install on
 * a Minecraft server; the rest of the documentation is a web app you sign into.
 * Somebody reading one is almost never reading the other in the same sitting,
 * and a single sidebar holding both buries fifteen pages about YAML under a
 * heading somebody scrolls past — see `SectionTabs` for the same argument
 * about the API Reference.
 *
 * Hand-written, like the docs tree and unlike the API's, because prose pages
 * are hand-written. Adding a page is two steps:
 *   1. create `src/app/(engine)/rp-engine/<segment>/page.mdx`
 *   2. add an entry here
 *
 * A page that exists but is not listed is reachable by URL and invisible
 * everywhere else, which is a bug rather than a draft.
 */

import type { NavGroup } from "@/lib/nav";

export const ENGINE_ROOT = "/rp-engine";

/**
 * The groups are the order somebody meets the plugin in: what it is, then
 * the files they write, then the models those files describe, then the things
 * that happen at runtime, then everything that is somebody else's plugin.
 */
export const engineNav: NavGroup[] = [
  {
    title: "Get started",
    items: [
      {
        title: "Overview",
        href: "/rp-engine",
        description:
          "What RP Engine is, what it needs, and your first item.",
        keywords: [
          "rp engine",
          "rpengine",
          "plugin",
          "spigot",
          "paper",
          "itemsadder",
          "modelengine",
          "install",
          "jar",
          "1.21.4",
        ],
      },
      {
        title: "The content folder",
        href: "/rp-engine/content",
        description:
          "How a pack is laid out, what an id is, and how a reload works.",
        keywords: [
          "content",
          "folder",
          "pack.yml",
          "namespace",
          "id",
          "yaml",
          "reload",
          "bundle",
          "layout",
        ],
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        title: "Items",
        href: "/rp-engine/items",
        description:
          "A vanilla item wearing a different model, and the numbers it carries.",
        keywords: [
          "item",
          "items",
          "material",
          "model",
          "texture",
          "armor",
          "armour",
          "equipment",
          "enchantment",
          "attribute",
          "durability",
          "food",
          "hat",
          "keep on death",
          "lore",
        ],
      },
      {
        title: "Making items do things",
        href: "/rp-engine/actions",
        description:
          "Triggers and a closed list of verbs, with an event for everything else.",
        keywords: [
          "action",
          "actions",
          "trigger",
          "right click",
          "left click",
          "attack",
          "consume",
          "cooldown",
          "command",
          "effect",
          "sound",
          "permission",
          "wand",
        ],
      },
      {
        title: "Sounds, icons and screens",
        href: "/rp-engine/interface",
        description:
          "Custom sound events, pictures that behave like letters, and GUI backdrops.",
        keywords: [
          "sound",
          "sounds",
          "icon",
          "icons",
          "font",
          "glyph",
          "emoji",
          "screen",
          "screens",
          "hud",
          "overlay",
          "gui",
        ],
      },
      {
        title: "Recipes, entities and liquids",
        href: "/rp-engine/world",
        description:
          "Crafting your items, mobs that wear your models, and pools with rules.",
        keywords: [
          "recipe",
          "recipes",
          "crafting",
          "smelting",
          "stonecutting",
          "entity",
          "entities",
          "mob",
          "spawn",
          "liquid",
          "liquids",
          "pool",
        ],
      },
    ],
  },
  {
    title: "Models",
    items: [
      {
        title: "Placing a model",
        href: "/rp-engine/models",
        description:
          "Putting one down, sitting on it, lighting a room, and where it may go.",
        keywords: [
          "model",
          "place",
          "placed",
          "furniture",
          "display entity",
          "seat",
          "sit",
          "chair",
          "hitbox",
          "scale",
          "solid",
          "light",
          "surface",
          "wall",
          "ceiling",
          "drop",
        ],
      },
      {
        title: "Animation",
        href: "/rp-engine/animation",
        description:
          "Keyframes from a .bbmodel, how they play, and two at once.",
        keywords: [
          "animation",
          "animate",
          "bbmodel",
          "blockbench",
          "keyframe",
          "loop",
          "hold",
          "once",
          "speed",
          "priority",
          "blend",
          "layer",
          "weight",
        ],
      },
      {
        title: "Bones that do something",
        href: "/rp-engine/bones",
        description:
          "Heads, hitboxes, seats and nametags, named the way your rig already names them.",
        keywords: [
          "bone",
          "bones",
          "behaviour",
          "behavior",
          "head",
          "hitbox",
          "seat",
          "mount",
          "driver",
          "nametag",
          "modelengine",
          "prefix",
        ],
      },
      {
        title: "Models on mobs",
        href: "/rp-engine/mobs",
        description:
          "Putting a model on an entity another plugin spawned, and keeping it there.",
        keywords: [
          "bind",
          "unbind",
          "mob",
          "npc",
          "mythicmobs",
          "citizens",
          "boss",
          "entity",
          "trait",
          "rpmodel",
        ],
      },
    ],
  },
  {
    title: "Players",
    items: [
      {
        title: "Emotes",
        href: "/rp-engine/emotes",
        description:
          "Animations played on the player — solo, with a cast, or worn.",
        keywords: [
          "emote",
          "emotes",
          "rig",
          "skin",
          "duet",
          "cast",
          "invite",
          "movement set",
          "stance",
          "sync",
          "push",
        ],
      },
    ],
  },
  {
    title: "Running a server",
    items: [
      {
        title: "Commands and permissions",
        href: "/rp-engine/commands",
        description: "Every command, what it needs, and how the nodes are laid out.",
        keywords: [
          "command",
          "commands",
          "permission",
          "permissions",
          "node",
          "rpengine.admin",
          "tab complete",
          "op",
          "luckperms",
        ],
      },
      {
        title: "Configuration",
        href: "/rp-engine/config",
        description: "config.yml, the chat palette, and icons in chat.",
        keywords: [
          "config",
          "config.yml",
          "chat",
          "colour",
          "color",
          "prefix",
          "palette",
          "pack format",
          "sync",
          "host",
          "port",
        ],
      },
      {
        title: "Other plugins",
        href: "/rp-engine/integrations",
        description:
          "PlaceholderAPI, WorldGuard, MythicMobs, Citizens and Geyser.",
        keywords: [
          "placeholderapi",
          "papi",
          "placeholder",
          "worldguard",
          "region",
          "flag",
          "mythicmobs",
          "citizens",
          "geyser",
          "bedrock",
          "integration",
          "hook",
        ],
      },
    ],
  },
  {
    title: "Developers",
    items: [
      {
        title: "The Java API",
        href: "/rp-engine/api",
        description: "Drive items, models, emotes and icons from your own plugin.",
        keywords: [
          "api",
          "java",
          "developer",
          "code",
          "bukkit",
          "softdepend",
          "event",
          "listener",
          "cancel",
          "ModelPlaceEvent",
          "EmoteStartEvent",
          "registry",
          "namespace",
        ],
      },
    ],
  },
];

/** Flat, in reading order — what the pager and the search index walk. */
export const engineItems = engineNav.flatMap((group) => group.items);

/** Whether a path belongs to this section. */
export function inEngine(pathname: string): boolean {
  return pathname === ENGINE_ROOT || pathname.startsWith(`${ENGINE_ROOT}/`);
}

/** The group a page belongs to — shown as the eyebrow above its title. */
export function engineGroupOf(href: string): string | undefined {
  return engineNav.find((group) => group.items.some((item) => item.href === href))
    ?.title;
}

/** The pages either side of {@link href}, for the pager. */
export function engineNeighbours(href: string) {
  const at = engineItems.findIndex((item) => item.href === href);
  if (at < 0) return { previous: undefined, next: undefined };
  return {
    previous: at > 0 ? engineItems[at - 1] : undefined,
    next: at < engineItems.length - 1 ? engineItems[at + 1] : undefined,
  };
}

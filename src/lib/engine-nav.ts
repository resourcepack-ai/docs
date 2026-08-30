/**
 * RP Engine's own navigation.
 *
 * Deliberately NOT part of `lib/nav.ts`. RP Engine is a plugin you install on
 * a Minecraft server; the rest of the documentation is a web app you sign into.
 * Somebody reading one is almost never reading the other in the same sitting,
 * and a single sidebar holding both buries thirty pages about YAML under a
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
 *
 * **One feature per page.** Recipes, entities and liquids were one page once
 * and it was three unrelated things sharing a URL: nobody looking for one of
 * them was helped by the other two being above it, the table of contents was
 * the only way to find anything, and no page could grow without making its
 * neighbours harder to read. A short page is not a problem — a page that is
 * two answers to two questions is.
 */

import type { NavItem } from "@/lib/nav";

export const ENGINE_ROOT = "/rp-engine";

/**
 * A page, optionally with pages underneath it.
 *
 * <p>Two levels and no more. The sidebar collapses, so a third would be a
 * thing to open twice before reading — and the depth is doing organisational
 * work rather than describing anything real about the pages.
 */
export type EngineItem = NavItem & { items?: NavItem[] };

export type EngineGroup = { title: string; items: EngineItem[] };

/**
 * The groups are the order somebody meets the plugin in: what it is, how a
 * pack is put together, then each kind of content, then the models, then what
 * happens at runtime, then everything that is somebody else's plugin.
 */
export const engineNav: EngineGroup[] = [
  {
    title: "Get started",
    items: [
      {
        title: "Overview",
        href: "/rp-engine",
        description: "What RP Engine is, and what it holds.",
        keywords: ["rp engine", "rpengine", "plugin", "spigot", "paper", "itemsadder", "modelengine"],
      },
      {
        title: "Installing",
        href: "/rp-engine/install",
        description: "The jar, what it needs, and your first item.",
        keywords: ["install", "setup", "jar", "1.19.4", "java 17", "first item", "quickstart"],
      },
      {
        title: "Minecraft versions",
        href: "/rp-engine/versions",
        description: "What works on which version, and what an older one costs you.",
        keywords: [
          "version", "versions", "1.19.4", "1.20", "1.21", "supported", "compatibility",
          "pack format", "floor", "legacy", "custom model data", "java 17",
        ],
      },
    ],
  },
  {
    title: "How a pack works",
    items: [
      {
        title: "The content folder",
        href: "/rp-engine/content",
        description: "How a pack is laid out on disk, and what pack.yml says.",
        keywords: ["content", "folder", "layout", "pack.yml", "assets", "overrides", "yaml"],
      },
      {
        title: "IDs and namespaces",
        href: "/rp-engine/ids",
        description: "One id for everything, and why it needs no numbers.",
        keywords: ["id", "namespace", "resource location", "custom model data", "item_model", "reserved"],
      },
      {
        title: "Bundles",
        href: "/rp-engine/bundles",
        description: "The built zips, and holding more than one at a time.",
        keywords: ["bundle", "zip", "stack", "default-bundle", "lobby", "swap"],
      },
      {
        title: "Reloading",
        href: "/rp-engine/reloading",
        description: "What a reload replaces, and what survives it.",
        keywords: ["reload", "rebuild", "orphan", "purge", "restart", "persistence"],
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        title: "Models",
        href: "/rp-engine/models",
        description: "Putting a model down at its real size, and what it collides with.",
        keywords: ["model", "place", "furniture", "display entity", "facing", "hitbox", "solid"],
        items: [
          {
            title: "Seats, light and surfaces",
            href: "/rp-engine/placement-options",
            description: "Sitting on a model, lighting a room, and where one may go.",
            keywords: ["seat", "sit", "chair", "light", "lamp", "surface", "wall", "ceiling"],
          },
          {
            title: "Animation",
            href: "/rp-engine/animation",
            description: "Keyframes read straight out of a Blockbench save file.",
            keywords: ["animation", "bbmodel", "blockbench", "keyframe", "bone", "rig", "export"],
          },
          {
            title: "Controlling playback",
            href: "/rp-engine/playback",
            description: "Loop, hold or once — and speed, priority and crossfades.",
            keywords: ["loop", "hold", "once", "speed", "priority", "blend", "crossfade", "door"],
          },
          {
            title: "Layers and masks",
            href: "/rp-engine/layers",
            description: "Playing two animations at once, and on part of a model.",
            keywords: ["layer", "weight", "mask", "bones", "overlay", "wave", "walk"],
          },
          {
            title: "Bones that do something",
            href: "/rp-engine/bones",
            description: "Heads, hitboxes, seats and nametags, from the bone's name.",
            keywords: ["bone", "head", "hitbox", "seat", "mount", "nametag", "modelengine", "prefix"],
          },
          {
            title: "Putting one on a mob",
            href: "/rp-engine/mobs",
            description: "Wearing a model on an entity another plugin spawned.",
            keywords: ["bind", "unbind", "mob", "entity", "boss", "npc", "invisible"],
          },
        ],
      },
      {
        title: "Custom blocks",
        href: "/rp-engine/blocks",
        description: "A block you can place, mine and stand on. Finite, and worth knowing why.",
        keywords: ["block", "blocks", "ore", "note block", "mushroom", "mine", "hardness",
          "blockstate", "custom block"],
      },
      {
        title: "Items",
        href: "/rp-engine/items",
        description: "A vanilla item wearing a different model.",
        keywords: ["item", "material", "model", "texture", "bbmodel", "lore", "glow", "copy-model"],
        items: [
          {
            title: "Armour",
            href: "/rp-engine/armour",
            description: "Any item worn on a body, with its own art.",
            keywords: ["armor", "armour", "equipment", "helmet", "leggings", "humanoid", "trim"],
          },
          {
            title: "Stats and components",
            href: "/rp-engine/stats",
            description: "Damage, durability, enchantments and food.",
            keywords: ["attribute", "damage", "enchantment", "durability", "food", "hat", "keep on death"],
          },
          {
            title: "Actions",
            href: "/rp-engine/actions",
            description: "Triggers and a closed list of verbs.",
            keywords: ["action", "trigger", "right click", "cooldown", "command", "effect", "wand"],
          },
        ],
      },
      {
        title: "Emotes",
        href: "/rp-engine/emotes",
        description: "Animations played on the player — solo, with a cast, or worn.",
        keywords: ["emote", "rig", "skin", "duet", "cast", "invite", "movement set", "stance"],
      },
      {
        title: "Sounds",
        href: "/rp-engine/sounds",
        description: "Real sound events, with subtitles.",
        keywords: ["sound", "ogg", "vorbis", "subtitle", "category", "stream", "audio"],
      },
      {
        title: "GUIs",
        href: "/rp-engine/screens",
        description: "A picture drawn behind a container window.",
        keywords: ["screen", "gui", "menu", "container", "chest", "backdrop", "inventory"],
      },
      {
        title: "HUD",
        href: "/rp-engine/hud",
        description: "Something drawn over the game rather than behind a window.",
        keywords: ["hud", "overlay", "action bar", "boss bar", "mana", "health"],
      },
      {
        title: "Icons",
        href: "/rp-engine/icons",
        description: "Pictures that behave like letters, anywhere text renders.",
        keywords: ["icon", "font", "glyph", "emoji", "codepoint", "ascent", "shortcode"],
      },
      {
        title: "Recipes",
        href: "/rp-engine/recipes",
        description: "Crafting, cooking and stonecutting your own items.",
        keywords: ["recipe", "craft", "shaped", "shapeless", "smelting", "blasting", "stonecutting"],
      },
      {
        title: "Entities",
        href: "/rp-engine/entities",
        description: "A real mob wearing one of your models.",
        keywords: ["entity", "mob", "spawn", "health", "tags", "ai", "loot", "guard"],
      },
      {
        title: "Liquids",
        href: "/rp-engine/liquids",
        description: "Real water or lava with your rules applied inside a box.",
        keywords: ["liquid", "water", "lava", "pool", "acid", "effect", "damage", "swim",
          "colour", "color", "tint", "bucket", "biome"],
      },
    ],
  },
  {
    title: "Running a server",
    items: [
      {
        title: "Commands",
        href: "/rp-engine/commands",
        description: "Every command, and what it takes.",
        keywords: ["command", "rp", "rpe", "tab complete", "give", "reload", "purge"],
      },
      {
        title: "Permissions",
        href: "/rp-engine/permissions",
        description: "One node per command, and the three that gate something else.",
        keywords: ["permission", "node", "rpengine.admin", "op", "luckperms", "vault", "default"],
      },
      {
        title: "Configuration",
        href: "/rp-engine/config",
        description: "config.yml — the pack format, the chat palette, chat icons.",
        keywords: ["config", "chat", "colour", "prefix", "palette", "pack format", "port", "sync"],
      },
    ],
  },
  {
    title: "Plugin support",
    items: [
      {
        title: "PlaceholderAPI",
        href: "/rp-engine/placeholderapi",
        description: "Every placeholder, for scoreboards, menus and chat formats.",
        keywords: ["placeholderapi", "papi", "placeholder", "scoreboard", "hologram", "menu"],
      },
      {
        title: "MythicMobs",
        href: "/rp-engine/mythicmobs",
        description: "Three mechanics, driven from a skill tree.",
        keywords: ["mythicmobs", "mechanic", "rpmodel", "rpanimate", "skill", "onspawn", "boss"],
      },
      {
        title: "Citizens",
        href: "/rp-engine/citizens",
        description: "An NPC that keeps its model across a respawn.",
        keywords: ["citizens", "npc", "trait", "rpmodel", "respawn", "despawn", "persist"],
      },
      {
        title: "WorldGuard",
        href: "/rp-engine/worldguard",
        description: "Two region flags, built on events the engine already fired.",
        keywords: ["worldguard", "region", "flag", "protection", "spawn", "deny", "bypass"],
      },
      {
        title: "Bedrock and Geyser",
        href: "/rp-engine/bedrock",
        description: "What Bedrock players get, and what they do not.",
        keywords: ["bedrock", "geyser", "floodgate", "mcpack", "cross-play"],
      },
    ],
  },
  {
    title: "Migrating",
    items: [
      {
        title: "Moving from ItemsAdder",
        href: "/rp-engine/itemsadder",
        description: "Drop an ItemsAdder pack in and it loads. What comes across, and what does not.",
        keywords: ["itemsadder", "ia", "migrate", "migration", "import", "convert", "contents",
          "font_images", "behaviours", "compatibility"],
      },
      {
        title: "Moving from ModelEngine",
        href: "/rp-engine/modelengine",
        description: "Drop a blueprints folder in. The bone names already mean the same thing.",
        keywords: ["modelengine", "model engine", "blueprint", "blueprints", "bbmodel", "meg",
          "migrate", "migration", "rig", "bones"],
      },
    ],
  },
  {
    title: "Developers",
    items: [
      {
        title: "Plugin API",
        href: "/rp-engine/api",
        description: "Drive items, models, emotes and icons from your own plugin.",
        keywords: ["api", "java", "kotlin", "developer", "bukkit", "softdepend", "event", "listener", "registry"],
      },
    ],
  },
];

/**
 * Flat, in reading order — what the pager, the search index and the sitemap
 * walk. A child follows its parent, which is the order the sidebar shows and
 * therefore the order "next" should mean.
 */
export const engineItems: NavItem[] = engineNav.flatMap((group) =>
  group.items.flatMap((item) => [
    { title: item.title, href: item.href, description: item.description, keywords: item.keywords },
    ...(item.items ?? []),
  ]),
);

/** Whether a path belongs to this section. */
export function inEngine(pathname: string): boolean {
  return pathname === ENGINE_ROOT || pathname.startsWith(`${ENGINE_ROOT}/`);
}

/**
 * The eyebrow above a page's title.
 *
 * A child page shows its PARENT rather than its group: on "Armour" the useful
 * thing to say is "Items", and the group name is already the heading it sits
 * under in the sidebar beside it.
 */
export function engineGroupOf(href: string): string | undefined {
  for (const group of engineNav) {
    for (const item of group.items) {
      if (item.href === href) return group.title;
      if (item.items?.some((child) => child.href === href)) return item.title;
    }
  }
  return undefined;
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

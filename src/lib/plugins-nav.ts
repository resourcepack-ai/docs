/**
 * The Plugins section's navigation: our standalone server plugins that are
 * not RP Engine.
 *
 * Its own tree for the same reason RP Engine has one. Somebody reading about
 * a plugin has a server console open, not the web app, and none of these
 * plugins needs RP Engine (or the Studio) to run. Filing them under either of
 * those would tell a reader something false about what they have to install.
 *
 * One page per plugin, and no pages under a plugin, so this is the flat
 * `NavGroup` shape the docs tree uses rather than RP Engine's two levels.
 * Adding a plugin is two steps:
 *   1. create `src/app/(plugins)/<segment>/page.mdx`
 *   2. add an entry here
 *
 * Because the pages sit at the top level of the URL space (`/dialog-engine`,
 * not `/plugins/dialog-engine`), which section a path belongs to cannot be
 * read off a prefix the way RP Engine's can. {@link inPlugins} answers it from
 * this list instead, so step 2 is also what puts the tab and the drawer right.
 */

import type { NavGroup, NavItem } from "@/lib/nav";

/** The section's landing page, and where its tab points. */
export const PLUGINS_ROOT = "/plugins";

export const pluginsNav: NavGroup[] = [
  {
    title: "Get started",
    items: [
      {
        title: "All plugins",
        href: PLUGINS_ROOT,
        description: "Our server plugins besides RP Engine, and what each one is for.",
        keywords: ["plugins", "spigot", "paper", "server", "jar", "download", "overview"],
      },
    ],
  },
  {
    title: "Screens",
    items: [
      {
        title: "MC GUI",
        href: "/mcgui",
        description: "Real screens in Minecraft written in HTML and CSS, fullscreen with a mouse pointer or on walls.",
        keywords: [
          "mc gui", "mcgui", "/mcgui", "/gui", "/ui", "ui engine", "uiengine", "html", "css", "page", "screen",
          "menu", "gui", "fullscreen", "wall", "map", "maps", "item frame", "overlay", "blur", "pointer", "cursor",
          "mouse", "hover", "button", "data-command", "data-console", "placeholder", "placeholderapi", "form",
          "mcgui.dev", "import", "editor", "1.21.11", "spigot", "paper", "api", "pageclickevent", "canvas",
        ],
      },
    ],
  },
  {
    title: "Dialogs",
    items: [
      {
        title: "Dialog Engine",
        href: "/dialog-engine",
        description: "Minecraft's own dialog screens, written in YAML, with a Java API for developers.",
        keywords: [
          "dialog engine", "dialogengine", "dialog", "dialogue", "menu", "gui", "form", "/de", "/dialogs",
          "yaml", "minimessage", "button", "input", "text box", "dropdown", "switch", "slider",
          "action", "condition", "list", "placeholder", "placeholderapi", "1.21.7", "spigot", "paper",
          "api", "event", "drawn dialog", "editor",
        ],
      },
      {
        title: "Punishments",
        href: "/punishments",
        description: "Warn, mute, kick and ban from a real Minecraft menu or plain commands, built on Dialog Engine.",
        keywords: [
          "punishments", "punish", "/punish", "ban", "tempban", "mute", "kick", "warn", "unban", "unmute",
          "history", "moderation", "staff", "ip ban", "escalation", "addon", "dialog engine",
        ],
      },
    ],
  },
  {
    title: "3D models",
    items: [
      {
        title: "3D Engine",
        href: "/3d-engine",
        description: "Drop in a .glb, .gltf or .obj file and it is in the game, textured and animated, with no mods.",
        keywords: [
          "3d engine", "3dengine", "/3d", "3d model", "mesh", "gltf", "glb", "obj", "sketchfab", "blender",
          "furniture", "statue", "prop", "creature", "animation", "seat", "sit", "hitbox", "state", "quality",
          "triangles", "shader", "effect", "26.3", "spigot", "paper", "api", "addon",
        ],
      },
      {
        title: "3D Pets",
        href: "/3d-pets",
        description: "A 3D dog that follows you, sits when told and plays fetch, built on 3D Engine.",
        keywords: [
          "3d pets", "3dpets", "/pet", "pet", "dog", "labrador", "companion", "follow", "sit", "fetch",
          "tennis ball", "3d engine", "addon", "26.3",
        ],
      },
    ],
  },
];

/** Every page in sidebar order: what the pager, the search index and the sitemap walk. */
export const pluginItems: NavItem[] = pluginsNav.flatMap((group) => group.items);

/**
 * Whether a path belongs to this section: the landing page, a plugin's page,
 * or anything that ever grows underneath one.
 */
export function inPlugins(pathname: string): boolean {
  return pluginItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}

/** The group label shown above a page's title. */
export function pluginsGroupOf(href: string): string | undefined {
  return pluginsNav.find((group) => group.items.some((item) => item.href === href))?.title;
}

/** The pages either side of {@link href}, for the pager. */
export function pluginsNeighbours(href: string): { previous?: NavItem; next?: NavItem } {
  const at = pluginItems.findIndex((item) => item.href === href);
  if (at < 0) return {};
  return {
    previous: at > 0 ? pluginItems[at - 1] : undefined,
    next: at < pluginItems.length - 1 ? pluginItems[at + 1] : undefined,
  };
}

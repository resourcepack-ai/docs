import {
  Blocks,
  Boxes,
  Brush,
  Image as ImageIcon,
  Plug,
  Rocket,
  Server,
  Sparkles,
  Wrench,
} from "lucide-react";

/**
 * A curated icon set, addressed by name.
 *
 * MDX pages get `<Card icon="server">` instead of an import + JSX element,
 * which keeps content files free of component imports. Add to this map
 * rather than widening `Card` to take arbitrary nodes — a fixed set is
 * what stops the docs sprouting fifteen slightly-different icon styles.
 */
export const cardIcons = {
  blocks: Blocks,
  boxes: Boxes,
  brush: Brush,
  image: ImageIcon,
  plug: Plug,
  rocket: Rocket,
  server: Server,
  sparkles: Sparkles,
  wrench: Wrench,
} as const;

export type CardIconName = keyof typeof cardIcons;

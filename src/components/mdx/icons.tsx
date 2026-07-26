import {
  Blocks,
  BookOpen,
  Boxes,
  Brush,
  Cpu,
  Download,
  Image as ImageIcon,
  Plug,
  Rocket,
  Server,
  Sparkles,
  Terminal,
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
  book: BookOpen,
  boxes: Boxes,
  brush: Brush,
  cpu: Cpu,
  download: Download,
  image: ImageIcon,
  plug: Plug,
  rocket: Rocket,
  server: Server,
  sparkles: Sparkles,
  terminal: Terminal,
  wrench: Wrench,
} as const;

export type CardIconName = keyof typeof cardIcons;

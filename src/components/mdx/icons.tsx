import {
  AppWindow,
  Blocks,
  Boxes,
  Brush,
  Download,
  Gauge,
  Image as ImageIcon,
  Package,
  Plug,
  Rocket,
  Server,
  Sparkles,
  Users,
  Volume2,
  Wallet,
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
  download: Download,
  gauge: Gauge,
  gui: AppWindow,
  image: ImageIcon,
  item: Package,
  plug: Plug,
  rocket: Rocket,
  server: Server,
  sound: Volume2,
  sparkles: Sparkles,
  users: Users,
  wallet: Wallet,
  wrench: Wrench,
} as const;

export type CardIconName = keyof typeof cardIcons;

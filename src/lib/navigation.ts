import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bell,
  CalendarHeart,
  Candy,
  Gamepad2,
  Gift,
  Home,
  Images,
  ListChecks,
  Mail,
  Settings,
  Smile,
} from "lucide-react";

export const APP_TITLE = "The Little Things";
export const APP_TAGLINE = "A little world, made of our little moments.";

export type NavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { title: "Home", to: "/home", icon: Home },
  { title: "Our Memories", to: "/memories", icon: Images },
  { title: "Brownie Bank", to: "/brownies", icon: Candy },
  { title: "Little Rewards", to: "/rewards", icon: Gift },
  { title: "Love Letters", to: "/letters", icon: Mail },
  { title: "Our Timeline", to: "/timeline", icon: CalendarHeart },
  { title: "Happiness Jar", to: "/happiness", icon: Smile },
  { title: "Our Bucket List", to: "/bucket-list", icon: ListChecks },
  { title: "Little Games", to: "/games", icon: Gamepad2 },
  { title: "Achievements", to: "/achievements", icon: Award },
  { title: "Notifications", to: "/notifications", icon: Bell },
  { title: "Settings", to: "/settings", icon: Settings },
];
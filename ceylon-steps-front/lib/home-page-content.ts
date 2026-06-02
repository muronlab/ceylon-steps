import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Car,
  Plane,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

export const HOME_WALLPAPER_IMAGE = "/wallpapers/3.jpg";

export const HOME_DARK_FEATURE_IMAGE = "/wallpapers/2.jpg";

export type HomeServiceItem = {
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
};

export const HOME_SERVICES: HomeServiceItem[] = [
  {
    title: "Find Guides",
    desc: "Local experts for every region",
    icon: UsersRound,
    href: "/guides",
  },
  {
    title: "Hire / Rent Vehicle",
    desc: "With driver or self‑drive",
    icon: Car,
    href: "/vehicles",
  },
  {
    title: "Find an Agency",
    desc: "Trusted Sri Lanka travel agencies",
    icon: Building2,
    href: "/agencies",
  },
  {
    title: "Airport Pickups",
    desc: "Fast & safe transfers",
    icon: Plane,
    href: "/airport-pickups",
  },
  {
    title: "Tourist Insurance",
    desc: "Travel with confidence",
    icon: ShieldCheck,
    href: "/insurance",
  },
  {
    title: "Activities",
    desc: "Surf, abseil, balloon rides",
    icon: Sparkles,
    href: "/activities",
  },
];

export const HOME_STATS = [
  { value: "10M+", label: "Total Customers" },
  { value: "09+", label: "Years Of Experience" },
  { value: "12K", label: "Total Destinations" },
  { value: "5.0", label: "Average Rating" },
] as const;

export type HomePromoCard = {
  variant: "image" | "light" | "dark";
  title: string;
  desc?: string;
  href: string;
  image?: string;
  /** spans two columns on large screens */
  wide?: boolean;
};

export const HOME_PROMO_CARDS: HomePromoCard[] = [
  {
    variant: "image",
    title: "Local guides who know every corner of the island",
    desc: "Verified local experts for safaris, hikes, cultural sites and hidden gems across Sri Lanka.",
    href: "/guides",
    image: "/wallpapers/guide.png",
  },
  {
    variant: "image",
    title: "Vehicles, airport pickups and transport options for every traveler",
    desc: "From airport transfers to self-drive and chauffeur hire — book reliable rides island-wide.",
    href: "/transport",
    image: "/wallpapers/transport.png",
  },
];

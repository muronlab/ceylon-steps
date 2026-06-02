import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Car,
  Compass,
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
    desc: "Verified local experts for every region — from wildlife safaris and hill-country treks to cultural and heritage tours across the island.",
    icon: UsersRound,
    href: "/guides",
  },
  {
    title: "Hire / Rent Vehicle",
    desc: "Choose chauffeur-driven comfort or self-drive freedom. Cars, vans, bikes and tuk-tuks for every budget and route.",
    icon: Car,
    href: "/vehicles",
  },
  {
    title: "Find an Agency",
    desc: "Browse trusted Sri Lankan travel agencies offering full itineraries, multi-day packages and on-the-ground support.",
    icon: Building2,
    href: "/agencies",
  },
  {
    title: "Airport Pickups",
    desc: "Fast, safe transfers to and from the airport — booked in advance with on-time drivers, 24 hours a day.",
    icon: Plane,
    href: "/airport-pickups",
  },
  {
    title: "Tourist Insurance",
    desc: "Travel with confidence under cover for medical care, trip changes and the unexpected, tailored for visitors to Sri Lanka.",
    icon: ShieldCheck,
    href: "/insurance",
  },
  {
    title: "Activities",
    desc: "Surf, abseil, balloon rides and more — book unforgettable experiences and adventures right across the island.",
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
  /** Short category label shown above the title. */
  tag: string;
  title: string;
  desc: string;
  href: string;
  /** Lead icon for the card. */
  icon: LucideIcon;
  /** Short context line shown in the footer (e.g. coverage area). */
  meta: string;
  /** Average rating, displayed beside a star. */
  rating: string;
  /** Call-to-action label on the card button. */
  cta: string;
};

export const HOME_PROMO_CARDS: HomePromoCard[] = [
  {
    tag: "Curated trips",
    title: "Explore Sri Lanka, your way",
    desc: "From misty hill country to golden beaches and ancient cities — discover curated experiences across the island.",
    href: "/explore",
    icon: Compass,
    meta: "Island-wide",
    rating: "4.9",
    cta: "Explore",
  },
  {
    tag: "Local guides",
    title: "Guides who know every corner of the island",
    desc: "Verified local experts for safaris, hikes, cultural sites and hidden gems across Sri Lanka.",
    href: "/guides",
    icon: UsersRound,
    meta: "All regions",
    rating: "4.8",
    cta: "Find guides",
  },
  {
    tag: "Transport",
    title: "Vehicles, airport pickups and transfers",
    desc: "From airport transfers to self-drive and chauffeur hire — book reliable rides island-wide.",
    href: "/transport",
    icon: Car,
    meta: "24/7 service",
    rating: "4.9",
    cta: "Book transport",
  },
  {
    tag: "Activities",
    title: "Surf, abseil, balloon rides and more",
    desc: "Book unforgettable experiences and adventures right across the island — from coastlines to hill country.",
    href: "/activities",
    icon: Sparkles,
    meta: "Island-wide",
    rating: "4.9",
    cta: "Explore activities",
  },
];

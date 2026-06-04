export const ROUTE_HERO_IMAGES = {
  "/": "/wallpapers/3.jpg",
  "/guides": "/wallpapers/2.jpg",
  "/transport": "/wallpapers/3.jpg",
  "/explore": "/wallpapers/2.jpg",
  "/activities": "/wallpapers/3.jpg",
} as const

export type RouteHeroPath = keyof typeof ROUTE_HERO_IMAGES


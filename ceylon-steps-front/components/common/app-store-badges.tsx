import Image from "next/image";
import { cn } from "@/lib/utils";

/** Path to the combined Google Play + App Store badge artwork (400×245). */
const BADGES_SRC = "/common/1338051.png";

/**
 * "Get the app" block aimed at service providers — shown in the footer and on
 * the Become-a-Partner screen. `tone` flips the copy colours for dark vs light
 * surfaces. The PNG already contains both store badges stacked.
 */
export function AppStoreBadges({
  className,
  tone = "dark",
  align = "start",
  compact = false,
}: {
  className?: string;
  /** "dark" = on a dark surface (light text); "light" = on a light surface. */
  tone?: "dark" | "light";
  align?: "start" | "center";
  /** Compact = one short line + badges; full = heading + paragraph + badges. */
  compact?: boolean;
}) {
  const isDark = tone === "dark";
  return (
    <div
      className={cn(
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      {compact ? (
        <div
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            isDark ? "text-white/70" : "text-zinc-500",
          )}
        >
          Get the app
        </div>
      ) : (
        <>
          <div
            className={cn(
              "text-sm font-semibold",
              isDark ? "text-white" : "text-zinc-950",
            )}
          >
            Run your business on the go
          </div>
          <p
            className={cn(
              "mt-1 max-w-sm text-sm leading-6",
              align === "center" && "mx-auto",
              isDark ? "text-white/70" : "text-zinc-600",
            )}
          >
            A service provider? Download the Ceylon Step app and manage your
            profile, enquiries and bookings from your phone.
          </p>
        </>
      )}
      <Image
        src={BADGES_SRC}
        alt="Download the Ceylon Step app on Google Play or the App Store"
        width={400}
        height={245}
        className={cn(
          "h-auto w-72 select-none",
          compact ? "mt-3" : "mt-4",
          align === "center" && "mx-auto",
        )}
        unoptimized
      />
    </div>
  );
}

import { cn } from "@/lib/utils";

/**
 * Modern ring spinner: a faint track with a tapered orange (brand `primary-2`)
 * arc spinning on top. Size it with `className` (defaults to `size-4`); the
 * stroke is `border-2` by default and can be overridden via `className`.
 */
function Spinner({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-zinc-200/70 border-t-primary-2 border-r-primary-2/30 [animation-duration:0.7s] motion-reduce:[animation-duration:1.4s]",
        className,
      )}
      {...props}
    />
  );
}

export { Spinner };

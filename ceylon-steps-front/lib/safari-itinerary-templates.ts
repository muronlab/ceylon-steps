import type { SafariJeep } from "@/services/safari-jeeps.service"

/**
 * Build a punchy title that combines the safari jeep's parks + experiences
 * with natural connectors ("at", "with", "·"). We aim for short, scannable
 * titles that fit on a card — long phrases get trimmed.
 *
 * Inputs are intentionally loose (anything resembling a safari jeep) so this
 * can be unit-tested without the full type.
 */
type TemplateInput = Pick<
  SafariJeep,
  | "title"
  | "driverName"
  | "nationalParks"
  | "experiences"
  | "durationNotes"
  | "inclusions"
  | "passengerCapacity"
  | "driverYearsExperience"
>

/** Strip the "National Park" suffix so multi-park lists stay short. */
function shortParkName(p: string): string {
  return p.replace(/\s+National\s+Park\s*$/i, "").trim()
}

/** Lower-case the first letter of an experience so it sits naturally in a
 * sentence ("Sunrise safari at Yala" → "sunrise safari" when joined after a
 * connector). Keeps the original casing when used as the leading word. */
function lower(s: string): string {
  if (!s) return s
  return s.charAt(0).toLowerCase() + s.slice(1)
}

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Drop common qualifiers from experiences ("safari") so we can combine them
 * with park names without producing "Yala sunrise safari safari".
 */
function trimExperience(exp: string): string {
  return exp
    .replace(/\bsafari\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Generate up to ~8 title suggestions. The richer the jeep's data, the more
 * combinations we can produce; with little data we fall back to a few simple
 * variants on the driver / jeep title.
 *
 * The order roughly reflects what we expect to be most useful — strongest
 * combinations first.
 */
export function generateSafariTitleOptions(jeep: TemplateInput): string[] {
  const parks = (jeep.nationalParks ?? [])
    .map((p) => p.trim())
    .filter(Boolean)
  const experiences = (jeep.experiences ?? [])
    .map((e) => e.trim())
    .filter(Boolean)
  const driver = jeep.driverName?.trim() ?? ""

  const out = new Set<string>()
  const add = (s: string) => {
    const clean = s.replace(/\s+/g, " ").trim()
    if (clean.length > 0 && clean.length <= 90) out.add(clean)
  }

  const park1Short = parks[0] ? shortParkName(parks[0]) : ""
  const park2Short = parks[1] ? shortParkName(parks[1]) : ""

  // Rich case — at least one park AND one experience.
  if (parks.length > 0 && experiences.length > 0) {
    for (const park of parks.slice(0, 2)) {
      for (const exp of experiences.slice(0, 2)) {
        add(`${capitalize(exp)} at ${park}`)
        const trimmed = trimExperience(exp)
        if (trimmed) {
          add(`${shortParkName(park)} ${lower(trimmed)} safari`)
        }
      }
    }
    if (parks.length >= 2) {
      const parkList = [park1Short, park2Short].filter(Boolean).join(" & ")
      add(`${parkList} safari`)
      add(`${parkList} · ${capitalize(experiences[0])}`)
    }
    if (experiences.length >= 2) {
      const trimmed1 = trimExperience(experiences[0])
      const trimmed2 = trimExperience(experiences[1])
      const expList = [trimmed1, trimmed2].filter(Boolean).join(" & ")
      if (expList) add(`${park1Short} ${lower(expList)} safari`)
    }
    return Array.from(out).slice(0, 8)
  }

  // Only parks.
  if (parks.length > 0) {
    for (const park of parks.slice(0, 3)) {
      add(`${park} safari`)
      add(`Safari at ${park}`)
      if (driver) add(`${shortParkName(park)} safari with ${driver}`)
    }
    if (parks.length >= 2) {
      const parkList = [park1Short, park2Short].filter(Boolean).join(" & ")
      add(`${parkList} safari`)
    }
    return Array.from(out).slice(0, 8)
  }

  // Only experiences.
  if (experiences.length > 0) {
    for (const exp of experiences.slice(0, 3)) {
      add(capitalize(exp))
      if (driver) add(`${capitalize(exp)} with ${driver}`)
    }
    if (driver) add(`${experiences[0]} safari with ${driver}`)
    return Array.from(out).slice(0, 8)
  }

  // Nothing structural — fall back to driver + jeep title.
  if (driver) {
    add(`Safari with ${driver}`)
    add(`Wildlife safari with ${driver}`)
  }
  if (jeep.title?.trim()) add(jeep.title.trim())

  return Array.from(out).slice(0, 8)
}

/**
 * Generate up to ~6 subtitle suggestions. Subtitles are taglines — short,
 * supportive of the title. We weave in driver credentials, inclusions, and
 * duration notes.
 */
export function generateSafariSubtitleOptions(jeep: TemplateInput): string[] {
  const inclusions = (jeep.inclusions ?? [])
    .map((i) => i.trim())
    .filter(Boolean)
  const experiences = (jeep.experiences ?? [])
    .map((e) => e.trim())
    .filter(Boolean)
  const parks = (jeep.nationalParks ?? [])
    .map((p) => p.trim())
    .filter(Boolean)
  const driver = jeep.driverName?.trim() ?? ""
  const years = jeep.driverYearsExperience ?? null
  const duration = jeep.durationNotes?.trim() ?? ""
  const capacity = jeep.passengerCapacity ?? null

  const out = new Set<string>()
  const add = (s: string) => {
    const clean = s.replace(/\s+/g, " ").trim()
    if (clean.length > 0 && clean.length <= 140) out.add(clean)
  }

  // Driver credentials.
  if (driver && years && years > 0) {
    add(`Led by ${driver} · ${years} year${years === 1 ? "" : "s"} experience`)
  } else if (driver) {
    add(`Led by ${driver}`)
  }

  // Inclusions tagline — pick the most "marketing-friendly" ones.
  if (inclusions.length > 0) {
    add(inclusions.slice(0, 3).join(" · "))
  }
  if (inclusions.length >= 2) {
    add(`${inclusions[0]} · ${inclusions[1]}`)
  }

  // Experiences tagline.
  if (experiences.length >= 2) {
    add(experiences.slice(0, 2).join(" · "))
  } else if (experiences.length === 1 && driver) {
    add(`${experiences[0]} with ${driver}`)
  }

  // Duration + driver.
  if (duration && driver) {
    add(`${duration} · with ${driver}`)
  } else if (duration) {
    add(duration)
  }

  // Capacity hint (rare but useful for big-group bookings).
  if (capacity && capacity >= 4) {
    if (driver) add(`Up to ${capacity} guests · with ${driver}`)
    else add(`Up to ${capacity} guests`)
  }

  // Park-only fallback.
  if (parks.length >= 2 && driver) {
    add(`Game drives at ${parks.slice(0, 2).map(shortParkName).join(" & ")} with ${driver}`)
  }

  return Array.from(out).slice(0, 6)
}

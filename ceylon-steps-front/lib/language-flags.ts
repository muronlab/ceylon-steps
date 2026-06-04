import languagesData from "@/data/languages.json"

/**
 * Itineraries store `languagesOffered` as plain language *names* (e.g.
 * "English"), with no country code. Host/guide profiles store structured
 * language rows that carry a `countryCode`. To render the same flag treatment
 * on itinerary tiles, resolve the name back to a country code via the shared
 * language dataset (the same source the language picker uses).
 *
 * Names not in the dataset (e.g. a legacy free-text entry) resolve to null and
 * should render without a flag.
 */
const NAME_TO_CODE = new Map<string, string>(
  (languagesData as { language: string; countryCode: string }[]).map((l) => [
    l.language.toLowerCase(),
    l.countryCode,
  ]),
)

/** Resolve a language name (e.g. "English") to its 2-letter country code. */
export function languageCountryCode(name: string): string | null {
  return NAME_TO_CODE.get(name.trim().toLowerCase()) ?? null
}

/** flagcdn URL for a 2-letter country code. */
export function flagUrl(code: string, width: 20 | 40 | 80 = 40): string {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`
}

import { Play, Star } from "lucide-react"

function flagCdnUrl(countryCode: string) {
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`
}

function StarRating({ value, reviews }: { value: number; reviews?: number }) {
  const clamped = Math.max(0, Math.min(5, value))
  const full = Math.floor(clamped)
  const hasHalf = clamped - full >= 0.25 && clamped - full < 0.75
  const empty = 5 - full - (hasHalf ? 1 : 0)

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f-${i}`} className="size-4 fill-amber-400 text-amber-400" />
        ))}
        {hasHalf ? (
          <span className="relative inline-grid size-4 place-items-center">
            <Star className="absolute inset-0 size-4 fill-zinc-200 text-zinc-200" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
              <Star className="size-4 fill-amber-400 text-amber-400" />
            </span>
          </span>
        ) : null}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e-${i}`} className="size-4 fill-zinc-200 text-zinc-200" />
        ))}
      </div>
      <div className="text-xs font-semibold text-zinc-700">
        {clamped.toFixed(1)}{" "}
        {typeof reviews === "number" ? <span className="font-medium text-zinc-500">({reviews} reviews)</span> : null}
      </div>
    </div>
  )
}

export type GuideUserReview = {
  id: string
  name: string
  countryCode: string
  rating: number
  date: string
  title: string
  text: string
  kind: "text" | "video"
  mediaGradient?: string
}

export function GuideReviewsSection({
  guideDisplayName,
  overallRating,
  totalReviews,
  userReviews,
}: {
  guideDisplayName: string
  overallRating: number
  totalReviews: number
  userReviews: GuideUserReview[]
}) {
  return (
    <section id="reviews" className="w-full bg-zinc-50 py-14 sm:py-18">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">Reviews</div>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            What our users are saying
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-6 text-zinc-600 sm:text-base">
            Real stories from travelers who booked <span className="font-semibold text-zinc-800">{guideDisplayName}</span>.
          </p>
          <div className="mt-5 flex justify-center">
            <StarRating value={overallRating} reviews={totalReviews} />
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userReviews.map((r, idx) => {
            const isFeatured = r.kind === "video"
            const base =
              "overflow-hidden rounded-4xl bg-white ring-1 ring-zinc-200/70 shadow-[0_18px_55px_-45px_rgba(0,0,0,0.20)]"
            const span = isFeatured && idx === 3 ? "lg:row-span-2" : isFeatured ? "lg:col-span-1" : ""

            return (
              <article key={r.id} className={[base, span].join(" ")}>
                {r.kind === "video" ? (
                  <div className={["relative aspect-[4/3] w-full", r.mediaGradient ?? ""].join(" ")}>
                    <div className="absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.22)_0px,rgba(255,255,255,0.22)_2px,transparent_2px,transparent_14px)]" />
                    <button type="button" className="absolute inset-0 grid place-items-center" aria-label="Play review">
                      <span className="grid size-12 place-items-center rounded-full bg-white/80 ring-1 ring-white/70 backdrop-blur-md">
                        <Play className="size-5 fill-blue-600 text-blue-600" />
                      </span>
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="text-sm font-semibold text-white">{r.name}</div>
                      <div className="text-xs font-semibold text-white/70">{r.date}</div>
                    </div>
                  </div>
                ) : null}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm leading-6 text-zinc-700">“{r.text}”</div>
                    </div>
                    <div className="shrink-0">
                      <StarRating value={r.rating} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-50 ring-1 ring-zinc-200/70">
                      <img
                        src={flagCdnUrl(r.countryCode)}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-950">{r.name}</div>
                      <div className="text-xs text-zinc-500">{r.title}</div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}


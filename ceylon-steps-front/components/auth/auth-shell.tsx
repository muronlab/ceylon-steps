import Link from "next/link"

export function AuthShell({
  children,
  leftVideoSrc = "/wallpapers/istockphoto-1205979403-640_adpp_is.mp4",
  logoText = "CEYLON STEPS",
  leftKicker = "YOUR",
  leftTitle = "NEXT ADVENTURE\nAWAITS!",
  leftDescription = "Log in to unlock exclusive deals, plan your dream escapes, and pick up where you left off. Whether it's mountains, beaches, or city lights.\n\nYour journey starts here.",
  formTitle = "WELCOME BACK !",
  formSubtitle = "Welcome back! Please enter your details.",
}: {
  children: React.ReactNode
  leftVideoSrc?: string
  logoText?: string
  leftKicker?: string
  leftTitle?: string
  leftDescription?: string
  formTitle?: string
  formSubtitle?: string
}) {
  return (
    <div className="box-border min-h-dvh w-full bg-white px-4 py-4 sm:px-6 sm:py-6 overflow-hidden">
      <div className="grid w-full grid-cols-1 overflow-hidden rounded-4xl bg-white ring-1 ring-zinc-200/70 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.18)] lg:min-h-[calc(100dvh-3rem)] lg:grid-cols-2">
        {/* Left image panel */}
        <div className="relative hidden h-full min-h-[260px] lg:block">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={leftVideoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(255,255,255,0.10),transparent_60%)]" />

          <div className="absolute left-6 top-6 text-sm font-semibold tracking-wide text-white/90 md:left-10 md:top-9">
            <Link href="/" className="hover:opacity-90">
              <span className="inline-flex items-center gap-2">
                <span className="text-sm font-semibold tracking-[0.14em]">{logoText}</span>
              </span>
            </Link>
          </div>

          <div className="absolute inset-x-6 bottom-6 text-white md:inset-x-10 md:bottom-12 ">
            <div className="text-xs font-semibold tracking-[0.25em] text-white/80 md:text-sm">{leftKicker}</div>
            <div className="mt-2 whitespace-pre-line text-3xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
              {leftTitle}
            </div>
            <p className="mt-4 max-w-xl whitespace-pre-line text-xs leading-5 text-white/80 md:mt-6 md:text-sm md:leading-6">
              {leftDescription}
            </p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex h-full flex-col justify-center px-6 py-10 sm:px-10 md:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-6 flex justify-center lg:hidden">
              <Link href="/" className="text-sm font-semibold tracking-[0.14em] text-zinc-950 hover:opacity-80">
                {logoText}
              </Link>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold tracking-tight text-zinc-950 md:text-3xl">{formTitle}</div>
              <div className="mt-2 text-sm text-zinc-500">{formSubtitle}</div>
            </div>

            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}


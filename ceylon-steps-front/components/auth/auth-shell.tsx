import Link from "next/link"

import { AuthHero } from "@/components/auth/auth-hero"

export function AuthShell({
  children,
  leftVideoSrc = "/wallpapers/istockphoto-2182739265-640_adpp_is.mp4",
  logoText = "CEYLON STEPS",
  formTitle = "Welcome Back to Ceylon Steps",
  formSubtitle = "Sign in to your account",
  cornerLabel,
  cornerHref,
}: {
  children: React.ReactNode
  leftVideoSrc?: string
  logoText?: string
  formTitle?: string
  formSubtitle?: string
  cornerLabel?: string
  cornerHref?: string
}) {
  return (
    <div className="box-border min-h-dvh w-full overflow-hidden bg-white">
      <div className="grid min-h-dvh w-full grid-cols-1 overflow-hidden bg-white lg:grid-cols-2">
        {/* Left hero panel */}
        <AuthHero videoSrc={leftVideoSrc} logoText={logoText} />

        {/* Right form panel */}
        <div className="relative flex h-full flex-col justify-center px-6 py-12 sm:px-10 md:px-14 lg:px-16">
          {cornerLabel && cornerHref ? (
            <Link
              href={cornerHref}
              className="absolute right-6 top-6 inline-flex h-9 items-center rounded-full bg-zinc-950 px-5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 sm:right-10 md:right-14 lg:right-16"
            >
              {cornerLabel}
            </Link>
          ) : null}

          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 flex justify-center lg:hidden">
              <Link href="/" className="text-sm font-semibold tracking-[0.14em] text-zinc-950 hover:opacity-80">
                {logoText}
              </Link>
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 md:text-3xl">{formTitle}</h1>
              <p className="mt-1.5 text-sm text-zinc-500">{formSubtitle}</p>
            </div>

            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

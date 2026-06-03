"use client"

import { AuthShell } from "@/components/auth/auth-shell"
import { SocialButtonRow } from "@/components/auth/social-icon-row"
import { authService } from "@/services/auth.service"

export function UserLayout({
  formTitle,
  formSubtitle,
  children,
  footer,
  socialLabel = "Instant login",
  cornerLabel,
  cornerHref,
}: {
  formTitle: string
  formSubtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
  socialLabel?: string
  cornerLabel?: string
  cornerHref?: string
}) {
  return (
    <AuthShell
      leftVideoSrc="/wallpapers/istockphoto-2182739265-640_adpp_is.mp4"
      logoText="CEYLON STEPS"
      formTitle={formTitle}
      formSubtitle={formSubtitle}
      cornerLabel={cornerLabel}
      cornerHref={cornerHref}
    >
      <div className="flex flex-col">
        {children}

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-200" />
          <div className="text-sm font-medium text-zinc-500">{socialLabel}</div>
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <SocialButtonRow
          onGoogle={() => (window.location.href = authService.oauthGoogleUrl())}
          onFacebook={() => (window.location.href = authService.oauthFacebookUrl())}
          onApple={() => (window.location.href = authService.oauthAppleUrl())}
        />

        {footer ? <div className="pt-6">{footer}</div> : null}
      </div>
    </AuthShell>
  )
}

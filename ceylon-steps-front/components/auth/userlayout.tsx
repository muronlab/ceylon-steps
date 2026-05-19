"use client"

import { AuthShell } from "@/components/auth/auth-shell"
import { SocialIconRow } from "@/components/auth/social-icon-row"
import { authService } from "@/services/auth.service"

export function UserLayout({
  formTitle,
  formSubtitle,
  children,
  footer,
}: {
  formTitle: string
  formSubtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <AuthShell
      leftVideoSrc="/wallpapers/istockphoto-2182739265-640_adpp_is.mp4"
      logoText="CEYLON STEPS"
      leftKicker="YOUR"
      leftTitle={"NEXT ADVENTURE\nAWAITS!"}
      formTitle={formTitle}
      formSubtitle={formSubtitle}
    >
      <div className="flex min-h-[420px] flex-col">
        <SocialIconRow
          onFacebook={() => (window.location.href = authService.oauthFacebookUrl())}
          onGoogle={() => (window.location.href = authService.oauthGoogleUrl())}
          onApple={() => (window.location.href = authService.oauthAppleUrl())}
        />

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-200" />
          <div className="text-xs font-medium text-zinc-500">Or continue with email</div>
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <div className="flex-1">{children}</div>

        {footer ? <div className="pt-5">{footer}</div> : null}
      </div>
    </AuthShell>
  )
}


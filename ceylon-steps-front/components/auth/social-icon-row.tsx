"use client"

import { Button } from "@/components/ui/button"

function CircleIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-label={label}
      onClick={onClick}
      className="h-11 w-11 rounded-full border-zinc-200 bg-white p-0 hover:bg-zinc-50"
    >
      {children}
    </Button>
  )
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.574 32.659 29.303 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.682 0-14.35 4.336-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.281 0-9.742-3.322-11.478-7.946l-6.522 5.024C9.291 39.556 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.829 2.163-2.349 3.984-4.328 5.238l.003-.002 6.19 5.238C36.73 39.092 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

export function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.044 1.792-4.727 4.533-4.727 1.312 0 2.686.236 2.686.236v2.99h-1.512c-1.491 0-1.955.93-1.955 1.885v2.276h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
      />
      <path
        fill="#fff"
        d="M16.672 15.563l.532-3.49h-3.328V9.797c0-.955.464-1.885 1.955-1.885h1.512V4.922S15.97 4.686 14.657 4.686c-2.741 0-4.533 1.683-4.533 4.727v2.66H7.078v3.49h3.047V24a12.27 12.27 0 003.75 0v-8.437h2.797z"
      />
    </svg>
  )
}

export function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#111827"
        d="M16.7 13.2c0-2 1.6-3 1.7-3.1-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.8-2.7-.8-1.4 0-2.7.8-3.4 2.1-1.4 2.4-.4 6 1 8 0 0 1 1.5 2.2 1.4 1.1 0 1.6-.7 2.9-.7 1.3 0 1.8.7 3 .7 1.2 0 2-1.3 2-1.3.7-1 1-2 1-2-.1 0-1.6-.6-1.6-2.5zM14.7 6.9c.6-.8 1-1.9.9-3-.9.1-2 .6-2.6 1.4-.6.7-1.1 1.9-.9 2.9 1 0 2-.5 2.6-1.3z"
      />
    </svg>
  )
}

export function SocialIconRow({
  onGoogle,
  onFacebook,
  onApple,
}: {
  onGoogle: () => void
  onFacebook: () => void
  onApple: () => void
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <CircleIconButton label="Continue with Facebook" onClick={onFacebook}>
        <FacebookIcon />
      </CircleIconButton>
      <CircleIconButton label="Continue with Google" onClick={onGoogle}>
        <GoogleIcon />
      </CircleIconButton>
      <CircleIconButton label="Continue with Apple" onClick={onApple}>
        <AppleIcon />
      </CircleIconButton>
    </div>
  )
}

export function SocialButtonRow({
  onGoogle,
  onFacebook,
  onApple,
}: {
  onGoogle: () => void
  onFacebook: () => void
  onApple: () => void
}) {
  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        onClick={onGoogle}
        className="h-12 w-full gap-2.5 rounded-xl border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        <GoogleIcon />
        Continue with Google
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onFacebook}
        className="h-12 w-full gap-2.5 rounded-xl border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        <FacebookIcon />
        Continue with Facebook
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onApple}
        className="h-12 w-full gap-2.5 rounded-xl border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        <AppleIcon />
        Continue with Apple
      </Button>
    </div>
  )
}


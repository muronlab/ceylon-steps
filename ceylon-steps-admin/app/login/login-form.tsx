"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { login, logout, googleOAuthUrl, isAdmin } from "@/lib/auth-client";

const ERROR_MESSAGES: Record<string, string> = {
  not_admin: "This account doesn't have admin access. You've been signed out.",
  unauthorized: "You need to sign in first.",
};

type LoginFormProps = React.ComponentProps<"div"> & {
  initialError?: string | null;
};

export function LoginForm({
  className,
  initialError,
  ...props
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialError) {
      setError(ERROR_MESSAGES[initialError] ?? "Sign-in failed. Try again.");
    }
  }, [initialError]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      const me = await login(email.trim().toLowerCase(), password);
      if (!isAdmin(me)) {
        await logout();
        setError(ERROR_MESSAGES.not_admin);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          setError("Invalid email or password.");
        } else {
          const msg = (err.response?.data as { message?: string } | undefined)
            ?.message;
          setError(msg ?? "Sign-in failed. Try again.");
        }
      } else {
        setError("Sign-in failed. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function onGoogle() {
    window.location.href = googleOAuthUrl();
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={onSubmit} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Sign in to the Ceylon Step admin dashboard
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Sign-in problem</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Signing in..." : "Login"}
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>

              <Field>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onGoogle}
                  disabled={submitting}
                >
                  <GoogleIcon />
                  Continue with Google
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Admin access only. Standard accounts cannot sign in here.
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(59,130,246,0.45),transparent_55%),radial-gradient(800px_circle_at_85%_85%,rgba(99,102,241,0.35),transparent_50%),linear-gradient(135deg,#0f172a,#1e293b)]" />
            <div className="absolute inset-0 flex flex-col justify-between p-10 text-white">
              <div className="flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-lg bg-white/10 ring-1 ring-white/20 text-sm font-semibold backdrop-blur-sm">
                  CS
                </div>
                <span className="text-sm font-semibold tracking-tight">
                  Ceylon Step
                </span>
              </div>

              <div>
                <div className="text-sm uppercase tracking-[0.2em] text-white/60">
                  Admin Dashboard
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Operate the marketplace with confidence
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/75">
                  Review partner applications, manage listings, and keep the
                  platform running smoothly — all from one place.
                </p>
              </div>

              <div className="text-sm text-white/60">
                Built in Sri Lanka, designed for the world.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        By signing in, you agree to the platform&apos;s admin operating
        guidelines and security policies.
      </FieldDescription>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth-server";
import { LoginForm } from "./login-form";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const me = await getCurrentUser();
  if (isAdmin(me)) {
    redirect("/");
  }

  const params = await searchParams;
  const errorParam = typeof params.error === "string" ? params.error : null;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm initialError={errorParam} />
      </div>
    </div>
  );
}

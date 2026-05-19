import { cookies } from "next/headers";

export type Me = {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  roles: string[];
};

const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000/api/v1";

export async function getCurrentUser(): Promise<Me | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  if (!cookieHeader) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Me;
  } catch {
    return null;
  }
}

export function isAdmin(user: Me | null): boolean {
  if (!user || !Array.isArray(user.roles)) return false;
  return user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN");
}

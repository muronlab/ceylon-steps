import apiClient, { API_BASE_URL, clearCsrfToken } from "./api-client";

export type Me = {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  roles: string[];
};

export async function login(email: string, password: string): Promise<Me> {
  await apiClient.post("/auth/login", { email, password });
  const me = await apiClient.get<Me>("/auth/me");
  return me.data;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout", {});
  } finally {
    clearCsrfToken();
  }
}

export function googleOAuthUrl(): string {
  return `${API_BASE_URL}/auth/oauth/google?app=admin`;
}

export function isAdmin(me: Me | null | undefined): boolean {
  if (!me || !Array.isArray(me.roles)) return false;
  return me.roles.includes("ADMIN") || me.roles.includes("SUPER_ADMIN");
}

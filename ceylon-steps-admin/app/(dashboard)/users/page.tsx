import { getCurrentUser } from "@/lib/auth-server";
import { UsersTable } from "./users-table";

export default async function UsersPage() {
  const me = await getCurrentUser();
  const isSuperAdmin = me?.roles?.includes("SUPER_ADMIN") ?? false;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          User Management
        </h1>
        <p className="text-sm text-muted-foreground">
          View all registered users, manage activation status, and assign roles.
        </p>
      </div>
      <UsersTable isSuperAdmin={isSuperAdmin} currentUserId={me?.id ?? null} />
    </div>
  );
}

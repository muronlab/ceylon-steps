"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import {
  getUserDetail,
  setUserRoles,
  setUserStatus,
  type AdminUserDetail,
  type AdminUserListItem,
} from "@/lib/admin-api";

const ASSIGNABLE_ROLES = ["ADMIN", "GUIDE"] as const;
type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export function UserDetailSheet({
  userId,
  open,
  onOpenChange,
  onChanged,
  isSuperAdmin,
  isSelf,
}: {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: (u: AdminUserListItem) => void;
  isSuperAdmin: boolean;
  isSelf: boolean;
}) {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserDetail(userId);
      setUser(data);
    } catch (err) {
      setError(extractMessage(err, "Failed to load user."));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open && userId) {
      void load();
    } else if (!open) {
      setUser(null);
      setError(null);
    }
  }, [open, userId, load]);

  async function toggleStatus() {
    if (!user || isSelf) return;
    setSavingStatus(true);
    setError(null);
    try {
      const next = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
      const updated = await setUserStatus(user.id, next);
      const merged = { ...user, ...updated };
      setUser(merged);
      onChanged(updated);
    } catch (err) {
      setError(extractMessage(err, "Failed to update status."));
    } finally {
      setSavingStatus(false);
    }
  }

  async function toggleRole(role: AssignableRole, enabled: boolean) {
    if (!user || isSelf) return;
    const currentAssignable = user.roles.filter((r): r is AssignableRole =>
      (ASSIGNABLE_ROLES as readonly string[]).includes(r),
    );
    const nextSet = new Set(currentAssignable);
    if (enabled) nextSet.add(role);
    else nextSet.delete(role);

    setSavingRoles(true);
    setError(null);
    try {
      const updated = await setUserRoles(user.id, [...nextSet]);
      setUser(updated);
      onChanged({
        id: updated.id,
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        emailVerifiedAt: updated.emailVerifiedAt,
        sessionInvalidBefore: updated.sessionInvalidBefore,
        status: updated.status,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        roles: updated.roles,
        identities: updated.identities,
        guideApplicationsCount: updated.guideApplicationsCount,
      });
    } catch (err) {
      setError(extractMessage(err, "Failed to update roles."));
    } finally {
      setSavingRoles(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 min-w-[50vw]">
        <SheetHeader className="border-b p-5">
          <SheetTitle className="text-lg">User details</SheetTitle>
          <SheetDescription className="text-sm">
            Inspect and manage this account.
          </SheetDescription>
        </SheetHeader>

        <div className="p-5">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : !user ? (
            <div className="text-sm text-muted-foreground">
              No user selected.
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <section className="grid gap-2">
                <KV label="ID" value={user.id} />
                <KV label="Email" value={user.email} />
                <KV label="Name" value={user.name ?? "—"} />
                <KV label="Phone" value={user.phone ?? "—"} />
                <KV
                  label="Email verified"
                  value={
                    user.emailVerifiedAt
                      ? new Date(user.emailVerifiedAt).toLocaleString()
                      : "Not verified"
                  }
                />
                <KV
                  label="Forced sign-out at"
                  value={
                    user.sessionInvalidBefore
                      ? new Date(user.sessionInvalidBefore).toLocaleString()
                      : "Never"
                  }
                />
                <KV
                  label="Guide applications"
                  value={String(user.guideApplicationsCount)}
                />
                <KV
                  label="Created"
                  value={new Date(user.createdAt).toLocaleString()}
                />
                <KV
                  label="Last updated"
                  value={new Date(user.updatedAt).toLocaleString()}
                />
              </section>

              {user.guideProfile && (
                <section className="grid gap-2 border-t pt-4">
                  <div className="text-sm font-semibold">Guide profile</div>
                  <KV
                    label="Display name"
                    value={user.guideProfile.displayName}
                  />
                  <KV
                    label="Category"
                    value={user.guideProfile.category ?? "—"}
                  />
                  <KV
                    label="Approved at"
                    value={new Date(
                      user.guideProfile.approvedAt,
                    ).toLocaleString()}
                  />
                </section>
              )}

              <section className="grid gap-2 border-t pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">Account status</div>
                    <div className="text-sm text-muted-foreground">
                      Disabling signs the user out, blocks future sign-ins, and hides
                      any guide or transport profile they own. Re-enabling restores them.
                    </div>
                  </div>
                  <Switch
                    checked={user.status === "ACTIVE"}
                    disabled={savingStatus || isSelf}
                    onCheckedChange={toggleStatus}
                  />
                </div>
                {isSelf && (
                  <p className="text-sm text-muted-foreground">
                    You can&apos;t change your own status.
                  </p>
                )}
              </section>

              <section className="grid gap-3 border-t pt-4">
                <div>
                  <div className="text-sm font-semibold">Roles</div>
                  <div className="text-sm text-muted-foreground">
                    USER and SUPER_ADMIN can&apos;t be changed here. ADMIN can
                    only be granted by a super admin.
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {user.roles.map((r) => (
                    <Badge key={r} variant="secondary" className="font-normal">
                      {r}
                    </Badge>
                  ))}
                </div>
                <RoleToggle
                  label="ADMIN"
                  description="Grants access to this dashboard."
                  checked={user.roles.includes("ADMIN")}
                  disabled={
                    savingRoles ||
                    isSelf ||
                    !isSuperAdmin ||
                    user.roles.includes("SUPER_ADMIN")
                  }
                  onCheckedChange={(c) => toggleRole("ADMIN", c)}
                  hint={
                    !isSuperAdmin
                      ? "Only a super admin can change this."
                      : undefined
                  }
                />
                <RoleToggle
                  label="GUIDE"
                  description="Marks the user as a verified guide."
                  checked={user.roles.includes("GUIDE")}
                  disabled={savingRoles || isSelf}
                  onCheckedChange={(c) => toggleRole("GUIDE", c)}
                />
              </section>

              {user.identities.length > 0 && (
                <section className="grid gap-2 border-t pt-4">
                  <div className="text-sm font-semibold">
                    Linked sign-in providers
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {user.identities.map((id) => (
                      <Badge
                        key={id.id}
                        variant="outline"
                        className="font-normal"
                      >
                        {id.provider}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {user.recentGuideApplications.length > 0 && (
                <section className="grid gap-2 border-t pt-4">
                  <div className="text-sm font-semibold">
                    Recent guide applications
                  </div>
                  <div className="grid gap-2">
                    {user.recentGuideApplications.map((app) => (
                      <div
                        key={app.id}
                        className="rounded-md border bg-card px-3 py-2 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{app.displayName}</span>
                          <Badge variant="secondary" className="font-normal">
                            {app.status}
                          </Badge>
                        </div>
                        <div className="mt-0.5 text-sm text-muted-foreground">
                          Submitted {new Date(app.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-all font-medium">{value}</span>
    </div>
  );
}

function RoleToggle({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
  hint,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border bg-card px-3.5 py-2.5">
      <div className="flex flex-col gap-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm text-muted-foreground">{description}</span>
        {hint && <span className="text-sm text-amber-700">{hint}</span>}
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function extractMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { message?: string })?.message ?? fallback;
  }
  return fallback;
}

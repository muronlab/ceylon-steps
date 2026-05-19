"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import {
  listUsers,
  type AdminUserListItem,
  type UserStatus,
} from "@/lib/admin-api";
import { UserDetailSheet } from "./user-detail-sheet";

type StatusFilter = "ALL" | UserStatus;

export function UsersTable({
  isSuperAdmin,
  currentUserId,
}: {
  isSuperAdmin: boolean;
  currentUserId: string | null;
}) {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listUsers({
        search: search.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        take: 100,
      });
      setUsers(res.users);
      setTotal(res.total);
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) &&
          (err.response?.data as { message?: string })?.message) ||
        "Failed to load users.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(refresh, 200);
    return () => clearTimeout(t);
  }, [refresh]);

  function onUserUpdated(updated: AdminUserListItem) {
    setUsers((prev) =>
      prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)),
    );
  }

  const selectedUser = users.find((u) => u.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 w-72 pl-7"
          />
        </div>
        <div className="flex items-center gap-1">
          {(["ALL", "ACTIVE", "DISABLED"] as StatusFilter[]).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
            >
              {s === "ALL" ? "All" : s === "ACTIVE" ? "Active" : "Disabled"}
            </Button>
          ))}
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          {loading ? "Loading…" : `${total} user${total === 1 ? "" : "s"}`}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Sign-in</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Apps</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-0">{""}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-24 text-center text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedId(u.id)}
                >
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell>{u.name ?? "—"}</TableCell>
                  <TableCell>{u.phone ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {!Array.isArray(u.roles) || u.roles.length === 0 ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        u.roles.map((r) => (
                          <Badge
                            key={r}
                            variant="secondary"
                            className="font-normal"
                          >
                            {r}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="font-normal">
                        Password
                      </Badge>
                      {(u.identities ?? []).map((i) => (
                        <Badge
                          key={i.id}
                          variant="outline"
                          className="font-normal"
                        >
                          {i.provider}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={u.status} />
                  </TableCell>
                  <TableCell>
                    {u.emailVerifiedAt
                      ? new Date(u.emailVerifiedAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {u.guideApplicationsCount > 0 ? (
                      <Badge variant="secondary" className="font-normal">
                        {u.guideApplicationsCount}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(u.id);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserDetailSheet
        userId={selectedUser?.id ?? null}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        onChanged={onUserUpdated}
        isSuperAdmin={isSuperAdmin}
        isSelf={selectedUser?.id === currentUserId}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  if (status === "ACTIVE") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700"
      >
        Active
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-amber-200 bg-amber-50 text-amber-700"
    >
      Disabled
    </Badge>
  );
}

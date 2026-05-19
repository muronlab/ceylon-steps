"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth-client";

export function UserMenu({ email, roles }: { email: string; roles: string[] }) {
  const router = useRouter();

  async function onLogout() {
    await logout();
    router.replace("/login");
    router.refresh();
  }

  const initials = email ? email[0].toUpperCase() : "A";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <span className="grid size-5 place-items-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground">
            {initials}
          </span>
          <span className="hidden sm:inline-block max-w-[160px] truncate text-sm">
            {email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{email}</span>
          <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            {roles.join(", ") || "—"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="size-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

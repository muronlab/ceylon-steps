"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export type NavLeaf = {
  name: string;
  url: string;
  icon: LucideIcon;
  badge?: number;
};

export type NavBranchChild = {
  name: string;
  url: string;
  /**
   * Optional red badge value displayed at the end of the row. Hidden when
   * the value is undefined or 0.
   */
  badge?: number;
};

export type NavBranch = {
  name: string;
  icon: LucideIcon;
  children: NavBranchChild[];
};

export type NavItem = NavLeaf | NavBranch;

function NavBadge({ value }: { value: number | undefined }) {
  if (!value || value <= 0) return null;
  return (
    <span
      className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold leading-none text-white"
      aria-label={`${value} pending`}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

function isBranch(item: NavItem): item is NavBranch {
  return "children" in item;
}

export function NavMain({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname() ?? "";

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Manage</SidebarGroupLabel>
      <SidebarMenu>
        {navItems.map((item) =>
          isBranch(item) ? (
            <BranchItem key={item.name} item={item} pathname={pathname} />
          ) : (
            <LeafItem key={item.name} item={item} pathname={pathname} />
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function LeafItem({ item, pathname }: { item: NavLeaf; pathname: string }) {
  const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active}>
        <Link href={item.url}>
          <item.icon />
          <span>{item.name}</span>
          <NavBadge value={item.badge} />
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function BranchItem({ item, pathname }: { item: NavBranch; pathname: string }) {
  const anyActive = item.children.some(
    (c) => pathname === c.url || pathname.startsWith(`${c.url}/`),
  );
  const [open, setOpen] = React.useState(anyActive);

  React.useEffect(() => {
    setOpen(anyActive);
  }, [anyActive]);

  // Sum of all child badges — surfaced on the parent row when the branch is
  // collapsed, so the user notices pending work without expanding it.
  const branchBadge = item.children.reduce((acc, c) => acc + (c.badge ?? 0), 0);
  return (
    <Collapsible
      asChild
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.name} isActive={anyActive}>
            <item.icon />
            <span>{item.name}</span>
            <span className="ml-auto inline-flex items-center gap-1.5">
              {!open && <NavBadge value={branchBadge} />}
              <ChevronRight className="transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child) => {
              const active =
                pathname === child.url || pathname.startsWith(`${child.url}/`);
              return (
                <SidebarMenuSubItem key={child.url}>
                  <SidebarMenuSubButton asChild isActive={active}>
                    <Link href={child.url}>
                      <span>{child.name}</span>
                      <NavBadge value={child.badge} />
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

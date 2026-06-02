"use client";

import * as React from "react";
import { Car, Compass, Sparkles, Users } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain, type NavItem } from "./nav-main";
import { usePendingCounts } from "@/hooks/use-pending-counts";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const counts = usePendingCounts();
  const navItems: NavItem[] = [
    {
      name: "User Management",
      url: "/users",
      icon: Users,
    },
    {
      name: "Manage Guides",
      icon: Compass,
      children: [
        {
          name: "Guide Applications",
          url: "/guides/applications",
          badge: counts?.guides,
        },
        { name: "Guides", url: "/guides" },
      ],
    },
    {
      name: "Manage Transport",
      icon: Car,
      children: [
        {
          name: "Transport Applications",
          url: "/transport/applications",
          badge: counts?.transport,
        },
        { name: "Transport Providers", url: "/transport" },
        {
          name: "Type Change Requests",
          url: "/transport/type-change-requests",
        },
      ],
    },
    {
      name: "Manage Activities",
      icon: Sparkles,
      children: [
        {
          name: "Activity Applications",
          url: "/activity/applications",
          badge: counts?.activity,
        },
        { name: "Activity Providers", url: "/activity" },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center">
          <div className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground text-[10px] font-semibold">
            CS
          </div>
          <span className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Ceylon Step Admin
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain navItems={navItems} />
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
}

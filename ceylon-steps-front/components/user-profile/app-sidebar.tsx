"use client";

import * as React from "react";
import { Car, Compass, MessageCircle, Sparkles, User, type LucideIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context";
import { NavMain } from "./nav-main";

type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: { title: string; url: string }[];
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user } = useAuth();

  const roles = Array.isArray(user?.roles) ? user!.roles! : [];
  const isGuide = roles.includes("GUIDE");
  const isTransportProvider = roles.includes("TRANSPORT_PROVIDER");
  const isActivityProvider = roles.includes("ACTIVITY_PROVIDER");

  // Each profile is its own top-level route — no nested sub-routes.
  const navItems: NavItem[] = [];
  if (isGuide) {
    navItems.push({ title: "Guide profile", url: "/profile/guide", icon: Compass });
  }
  if (isTransportProvider) {
    navItems.push({ title: "Transport profile", url: "/profile/transport", icon: Car });
  }
  if (isActivityProvider) {
    navItems.push({
      title: "Activity provider profile",
      url: "/profile/activity",
      icon: Sparkles,
    });
  }

  if (navItems.length === 0) {
    navItems.push({ title: "Account", url: "/profile", icon: User });
  }

  if (isGuide || isTransportProvider) {
    navItems.push({
      title: "Chats",
      url: "/profile/chats",
      icon: MessageCircle,
    });
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
            <span className="text-xs font-black tracking-tighter">CS</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col gap-0.5 overflow-hidden transition-all duration-300">
              <span className="text-sm font-bold tracking-tight text-zinc-950 whitespace-nowrap">
                CEYLON STEPS
              </span>
              <span className="text-[10px] font-medium text-blue-500 whitespace-nowrap">
                Partner Dashboard
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth-server";
import { AppSidebar } from "@/components/nav/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { UserMenu } from "@/components/nav/user-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getCurrentUser();

  if (!me) {
    redirect("/login?error=unauthorized");
  }
  if (!isAdmin(me)) {
    redirect("/login?error=not_admin");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-1 data-[orientation=vertical]:h-4"
          />
          <div className="text-sm font-semibold text-foreground">
            Admin Console
          </div>
          <div className="ml-auto">
            <UserMenu email={me.email} roles={me.roles} />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 px-6 py-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

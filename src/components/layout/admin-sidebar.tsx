"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Settings, Plus, Info, LogOut, Server, Users } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_NAME } from "@/lib/constants";

const menuItems = [
  { title: "إعدادات الإدارة", href: "/sessions", icon: Settings },
  { title: "Add Router", href: "/router/new", icon: Plus },
  { title: "System Users", href: "/users", icon: Users },
  { title: "حول البرنامج", href: "/about", icon: Info },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  // On mobile the sidebar is an off-canvas drawer: close it after navigation.
  const closeMobileNav = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar side="right" variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link
          href="/sessions"
          onClick={closeMobileNav}
          className="flex items-center gap-3 rounded-xl px-2 py-2"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
            <Server className="h-5 w-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-bold text-white">
              {APP_NAME}
            </div>
            <div className="text-[10px] text-slate-400">لوحة الإدارة</div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3" onClick={closeMobileNav}>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.title}
                className="h-10"
              >
                <Link href={item.href}>
                  <item.icon className="h-[17px] w-[17px]" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          className="h-10 w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          تسجيل الخروج
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

/**
 * Mobile-only top bar for admin pages (hidden on md+ so desktop is unchanged).
 * Provides the drawer menu button that the old fixed sidebar never needed.
 */
export function AdminTopBar() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="sticky top-0 z-40 flex min-h-16 items-center gap-3 border-b bg-background/90 px-3 backdrop-blur-xl md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label="فتح قائمة الإدارة"
        className="h-10 w-10 shrink-0 rounded-xl"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="min-w-0 flex-1 truncate text-sm font-bold">
        {APP_NAME}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => signOut({ callbackUrl: "/login" })}
        aria-label="تسجيل الخروج"
        className="h-10 w-10 shrink-0 rounded-xl"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </header>
  );
}

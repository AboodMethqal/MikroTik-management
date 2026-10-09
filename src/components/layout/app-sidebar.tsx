"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserPlus, UserCog, Radio, Wifi, Server, Cookie, AreaChart,
  Link as LinkIcon, Laptop, KeyRound, Settings, Activity, Network,
  Globe, DollarSign, FileText, Ticket, ChevronDown, Printer, Clock, Edit, Info, List, ShoppingCart, UserRoundCog,
  ShieldCheck, DatabaseBackup, BellRing, Router, Gauge, CircleDollarSign,
} from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { APP_NAME } from "@/lib/constants";

type MenuItem = { title: string; href?: string; icon: React.ComponentType<{ className?: string }>; badge?: string; items?: { title: string; href: string; icon: React.ComponentType<{ className?: string }>; }[] };

const menuItems: MenuItem[] = [
  { title: "لوحة التحكم", href: "/", icon: LayoutDashboard },
  { title: "حالة الشبكة", href: "/network", icon: Gauge, badge: "LIVE" },
  { title: "أجهزة MikroTik", href: "/sessions", icon: Router },
  { title: "قطع التوزيع", href: "/distribution-points", icon: Network },
  { title: "مراقبة الترافيك", href: "/traffic", icon: AreaChart },
  { title: "التنبيهات والسجل", href: "/log/hotspot", icon: BellRing },
  { title: "صحة النظام", href: "/network/health", icon: ShieldCheck },
  { title: "هوت سبوت", icon: Wifi, items: [
    { title: "المستخدمون", href: "/hotspot/users", icon: List },
    { title: "إضافة مستخدم", href: "/hotspot/users/add", icon: UserPlus },
    { title: "توليد الكروت", href: "/hotspot/users/generate", icon: Ticket },
    { title: "ملفات المستخدمين", href: "/hotspot/profiles", icon: UserCog },
    { title: "المتصلون الآن", href: "/hotspot/active", icon: Radio },
    { title: "الأجهزة", href: "/hotspot/hosts", icon: Laptop },
    { title: "ربط IP", href: "/hotspot/ip-binding", icon: LinkIcon },
    { title: "ملفات الارتباط", href: "/hotspot/cookies", icon: Cookie },
    { title: "تنظيف المنتهية", href: "/hotspot/cleanup", icon: Clock },
  ]},
  { title: "User Manager", icon: UserRoundCog, items: [
    { title: "المستخدمون", href: "/user-manager", icon: Users },
    { title: "الملفات", href: "/user-manager", icon: UserCog },
    { title: "طباعة الكروت", href: "/quick-print", icon: Printer },
  ]},
  { title: "التقارير الذكية", href: "/reports", icon: AreaChart },
  { title: "أرشيف الكروت", href: "/cards", icon: Ticket },
  { title: "الكروت والطباعة", icon: Printer, items: [
    { title: "الكروت", href: "/vouchers", icon: Ticket },
    { title: "الطباعة السريعة", href: "/quick-print", icon: Printer },
    { title: "قوالب الكروت", href: "/settings/card-templates", icon: Edit },
  ]},
  { title: "المبيعات ونقاط البيع", icon: ShoppingCart, items: [
    { title: "نقاط البيع", href: "/pos", icon: StoreIcon },
    { title: "المبيعات", href: "/pos", icon: CircleDollarSign },
    { title: "التقارير المالية", href: "/report", icon: DollarSign },
  ]},
  { title: "PPP", icon: KeyRound, items: [
    { title: "المستخدمون", href: "/ppp/secrets", icon: KeyRound },
    { title: "الملفات", href: "/ppp/profiles", icon: Settings },
    { title: "المتصلون الآن", href: "/ppp/active", icon: Activity },
  ]},
  { title: "خدمات الشبكة", icon: Network, items: [
    { title: "تأجيرات DHCP", href: "/dhcp", icon: Network },
    { title: "WebFig", href: "/webfig", icon: Globe },
    { title: "السجلات", href: "/log/hotspot", icon: FileText },
  ]},
  { title: "النظام والأمان", icon: ShieldCheck, items: [
    { title: "المستخدمون والصلاحيات", href: "/users", icon: Users },
    { title: "النسخ الاحتياطي", href: "/backup", icon: DatabaseBackup },
    { title: "المجدول", href: "/system/scheduler", icon: Clock },
    { title: "إعدادات النظام", href: "/settings/session", icon: Settings },
  ]},
  { title: "حول البرنامج", href: "/about", icon: Info },
];

function StoreIcon({ className }: { className?: string }) { return <ShoppingCart className={className} />; }

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar side="right" variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20"><Server className="h-5 w-5" /></div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden"><div className="truncate text-sm font-bold text-white">{APP_NAME}</div><div className="text-[10px] text-slate-400">Network Control Center</div></div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <SidebarGroup><SidebarGroupContent><SidebarMenu>
          {menuItems.map((item) => item.items ? (
            <Collapsible key={item.title} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild><SidebarMenuButton tooltip={item.title} className="h-9"><item.icon className="h-[17px] w-[17px]" /><span>{item.title}</span>{item.badge && <span className="mr-auto rounded bg-emerald-500/15 px-1.5 text-[9px] font-bold text-emerald-300">{item.badge}</span>}<ChevronDown className="mr-auto h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-180" /></SidebarMenuButton></CollapsibleTrigger>
                <CollapsibleContent><SidebarMenuSub>{item.items.map((sub) => <SidebarMenuSubItem key={`${item.title}-${sub.href}`}><SidebarMenuSubButton asChild isActive={pathname === sub.href}><Link href={sub.href}><sub.icon className="h-4 w-4" /><span>{sub.title}</span></Link></SidebarMenuSubButton></SidebarMenuSubItem>)}</SidebarMenuSub></CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : <SidebarMenuItem key={item.href}><SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title} className="h-9"><Link href={item.href!}><item.icon className="h-[17px] w-[17px]" /><span>{item.title}</span>{item.badge && <span className="mr-auto rounded bg-emerald-500/15 px-1.5 text-[9px] font-bold text-emerald-300">{item.badge}</span>}</Link></SidebarMenuButton></SidebarMenuItem>)}
        </SidebarMenu></SidebarGroupContent></SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3"><div className="rounded-xl bg-white/5 p-3 text-[11px] text-slate-400 group-data-[collapsible=icon]:hidden"><div className="mb-1 flex items-center gap-2 text-slate-200"><div className="h-2 w-2 rounded-full bg-emerald-400" /> النظام يعمل</div><div>RouterOS • مراقبة لحظية</div></div><div className="px-1 text-[10px] text-slate-500 group-data-[collapsible=icon]:hidden">Mikhmon Next • Methqal Tech Edition</div></SidebarFooter>
    </Sidebar>
  );
}

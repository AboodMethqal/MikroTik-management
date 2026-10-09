"use client";

import { useEffect, useState } from "react";
import { Bell, FlaskConical, Menu, Moon, Search, Sun, Wifi, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface HeaderProps { identity?: string; }

export function Header({ identity }: HeaderProps) {
  const { toggleSidebar } = useSidebar();
  const { setTheme, theme } = useTheme();
  const [time, setTime] = useState("");
  const [isMock, setIsMock] = useState(false);
  useEffect(() => { const tick = () => setTime(new Intl.DateTimeFormat("ar-YE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date())); tick(); const id = setInterval(tick, 1000); return () => clearInterval(id); }, []);
  useEffect(() => { let active = true; fetch("/api/session/router", { cache: "no-store" }).then((r) => r.json()).then((j) => { if (active && j?.success) setIsMock(j.data?.isMock === true); }).catch(() => {}); return () => { active = false; }; }, []);

  return (
    <header className="sticky top-0 z-50 flex min-h-16 items-center gap-3 border-b bg-background/90 px-3 backdrop-blur-xl md:px-6">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="القائمة" className="h-10 w-10 shrink-0 rounded-xl"><Menu className="h-5 w-5" /></Button>
      {isMock && <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300"><FlaskConical className="h-3.5 w-3.5" />MOCK / DEMO</span>}
      <div className="hidden min-w-0 flex-1 md:block"><div className="text-sm font-semibold">مركز التحكم بالشبكة</div><div className="text-[11px] text-muted-foreground">إدارة ومراقبة MikroTik في مكان واحد</div></div>
      <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
        <div className="hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground xl:flex"><Wifi className="h-3.5 w-3.5 text-emerald-500" /><span>الشبكة مستقرة</span><span className="font-mono text-foreground">{time}</span></div>
        {identity && <div className="hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs lg:flex"><ShieldCheck className="h-3.5 w-3.5 text-blue-500" /><span>{identity}</span></div>}
        <Button variant="outline" size="icon" aria-label="بحث" className="h-10 w-10 shrink-0 rounded-xl"><Search className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" aria-label="التنبيهات" className="relative h-10 w-10 shrink-0 rounded-xl"><Bell className="h-4 w-4" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" /></Button>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="المظهر" className="h-10 w-10 shrink-0 rounded-xl">{theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setTheme("light")}>الوضع الفاتح</DropdownMenuItem><DropdownMenuItem onClick={() => setTheme("dark")}>الوضع الداكن</DropdownMenuItem><DropdownMenuItem onClick={() => setTheme("system")}>حسب النظام</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      </div>
    </header>
  );
}

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, Header } from "@/components/layout";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const routerSession = cookieStore.get("mikhmon_session")?.value;

  if (!routerSession) {
    redirect("/sessions");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex min-h-[calc(100vh-4rem)] w-full min-w-0 flex-col overflow-y-auto bg-background px-3 py-4 md:px-6 md:py-6 lg:px-8">
          {children}
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}

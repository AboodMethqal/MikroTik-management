import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "تسجيل الدخول — Mikhmon Next • Methqal Tech",
  description:
    "Login to Mikhmon Next — Methqal Tech Edition, developed and maintained by Methqal Tech.",
};

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session) {
    redirect("/sessions");
  }

  return children;
}

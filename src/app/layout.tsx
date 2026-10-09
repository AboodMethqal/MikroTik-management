import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider, SessionProvider } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mikhmon Next — Methqal Tech Edition | مركز إدارة شبكات MikroTik",
  description:
    "Professional MikroTik network management, Hotspot, User Manager, card printing, POS, reporting, monitoring, and network administration platform developed and maintained by Methqal Tech.",
  openGraph: {
    title: "Mikhmon Next — Methqal Tech Edition",
    description:
      "منصة احترافية لإدارة شبكات MikroTik وHotspot وUser Manager والكروت ونقاط البيع والتقارير — تطوير وصيانة مثقال تك.",
    siteName: "Methqal Tech — مثقال تك",
    locale: "ar_YE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

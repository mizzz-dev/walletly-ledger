import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AppShell } from "@/components/layout/app-shell";
import { PwaRegister } from "@/components/layout/pwa-register";

export const metadata: Metadata = {
  title: "walletly-shared",
  description: "同棲・家族・仕事を横断できる共有家計簿 / 会計PWA",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "walletly-shared",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#6d5ef8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <PwaRegister />
          <AppShell />
          <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}

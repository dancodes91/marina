import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { marinaConfig } from "@/lib/marina";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${marinaConfig.name} · Service Portal`,
  description: "Seasonal work orders, slip storage, and service tracking",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0f2744",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}

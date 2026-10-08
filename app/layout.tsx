import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Fraunces, Nunito } from "next/font/google";
import { Sprout } from "lucide-react";
import { BottomNav, TopNav } from "@/components/Nav";
import "./globals.css";

const body = Nunito({ variable: "--font-body", subsets: ["latin"] });
const heading = Fraunces({ variable: "--font-heading", subsets: ["latin"], axes: ["SOFT", "opsz"] });

export const metadata: Metadata = {
  title: "Alongside",
  description: "Support between dietitian visits: check-ins, logging, and evidence-based answers.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbf6ef",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${heading.variable} antialiased`}>
        <header className="sticky top-0 z-10 border-b border-line/70 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur">
          <nav className="mx-auto flex max-w-2xl items-center gap-1 px-4 py-3 text-sm">
            <Link href="/" className="mr-auto flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-soft text-sage">
                <Sprout size={18} strokeWidth={2} aria-hidden />
              </span>
              <span className="font-display text-lg font-semibold text-foreground">Alongside</span>
            </Link>
            <TopNav />
          </nav>
        </header>
        <main className="mx-auto max-w-2xl px-4 pt-6 pb-28 sm:pb-12">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}

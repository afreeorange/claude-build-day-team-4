"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Heart, MessageCircleQuestion, SlidersHorizontal, Target } from "lucide-react";

const LINKS = [
  { href: "/", label: "Check in", icon: Heart },
  { href: "/history", label: "History", icon: BookOpen },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/ask", label: "Ask", icon: MessageCircleQuestion },
  { href: "/onboarding", label: "Settings", icon: SlidersHorizontal },
];

function useActive() {
  const path = usePathname();
  return (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
}

// Desktop: pill links in the top header. Hidden on phones, where BottomNav takes over.
export function TopNav() {
  const active = useActive();
  return (
    <>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href}
          className={`hidden rounded-full px-3 py-1.5 sm:inline-flex sm:items-center sm:gap-1.5 ${active(l.href) ? "bg-accent-soft font-semibold text-accent-strong" : "text-muted hover:bg-card hover:text-foreground"}`}>
          <l.icon size={15} strokeWidth={2} aria-hidden />
          {l.label}
        </Link>
      ))}
    </>
  );
}

export function BottomNav() {
  const active = useActive();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      <div className="grid grid-cols-5">
        {LINKS.map((l) => {
          const on = active(l.href);
          return (
            <Link key={l.href} href={l.href} aria-current={on ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${on ? "font-bold text-accent-strong" : "text-muted"}`}>
              <span className={`flex h-8 w-14 items-center justify-center rounded-full transition ${on ? "bg-accent-soft" : ""}`}>
                <l.icon size={20} strokeWidth={on ? 2.3 : 1.8} fill={on && l.icon === Heart ? "currentColor" : "none"} aria-hidden />
              </span>
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

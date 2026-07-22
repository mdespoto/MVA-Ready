"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/process", label: "Proces" },
  { href: "/seeker", label: "Tražitelj posla" },
  { href: "/employer", label: "Poslodavac" },
];

export function NavHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="font-serif text-xl font-bold tracking-tight text-ink">
            PRO<em className="not-italic text-teal">VJERI</em>
          </span>
          <span className="hidden border-l border-line pl-2.5 text-xs text-ink-soft sm:inline">
            Platforma provjerenih kompetencija
          </span>
        </Link>
        <nav className="flex gap-1 rounded-full bg-surface-sunken p-1">
          {LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  active ? "bg-teal text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

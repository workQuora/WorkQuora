import Link from "next/link";
import { Logo } from "./Logo";
import { SPA_URL } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/trust-safety", label: "Trust & Safety" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <a
          href={`${SPA_URL}/auth`}
          className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 sm:text-sm"
        >
          Log In
        </a>
      </div>

      {/* Mobile nav links — wraps below the header row so they don't need a hamburger/client JS */}
      <nav className="flex items-center gap-5 overflow-x-auto border-t border-border px-4 py-2.5 md:hidden">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

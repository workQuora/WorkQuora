import Link from "next/link";
import { Logo } from "./Logo";
import { SPA_URL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 w-full border-t border-border bg-surface-2 pt-16 pb-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand */}
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="text-xs font-medium leading-relaxed text-muted-foreground">
              WorkQuora is India&apos;s premier KYC-verified peer-to-peer freelance and gig
              marketplace. Empowering secure project collaborations through smart escrow
              payments, real-time messaging, and verified digital identity systems.
            </p>
            <div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              Secure Escrow System
            </div>
          </div>

          {/* Column 2: Explore Services */}
          <div className="text-center md:text-left">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">
              Explore Services
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <a href={SPA_URL} className="font-medium transition-colors hover:text-primary">
                  Browse Open Jobs
                </a>
              </li>
              <li>
                <a href={SPA_URL} className="font-medium transition-colors hover:text-primary">
                  Find Top Talent
                </a>
              </li>
              <li>
                <a href={`${SPA_URL}/auth?mode=register`} className="font-medium transition-colors hover:text-primary">
                  Post a Job Requirement
                </a>
              </li>
              <li>
                <a href={SPA_URL} className="font-medium transition-colors hover:text-primary">
                  Smart Payouts &amp; Wallet
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Company */}
          <div className="text-center md:text-left">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">
              Trust &amp; Company
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/about" className="font-medium transition-colors hover:text-primary">
                  About WorkQuora
                </Link>
              </li>
              <li>
                <Link href="/trust-safety" className="font-medium transition-colors hover:text-primary">
                  Trust &amp; Safety Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="font-medium transition-colors hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="font-medium transition-colors hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="text-center md:text-left">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">
              Contact Us
            </h4>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li className="flex items-center justify-center gap-2 md:justify-start">
                <span className="font-medium">support@workquora.com</span>
              </li>
              <li className="flex items-center justify-center gap-2 md:justify-start">
                <span className="font-medium">+91 99999 99999</span>
              </li>
              <li className="flex items-start justify-center gap-2 md:justify-start">
                <span className="font-medium">WorkQuora HQ, Bhopal, Madhya Pradesh, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="my-8 border-t border-border/60" />

        <p className="text-center text-[10px] font-medium text-muted-foreground/70">
          © {new Date().getFullYear()} WorkQuora Technologies Pvt Ltd. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

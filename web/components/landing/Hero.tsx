import Link from "next/link";
import { ShieldCheck, BadgeCheck, Zap, Lock, ArrowRight, MessageCircle } from "lucide-react";
import { SPA_URL } from "@/lib/constants";

const TRUST_ROW = [
  { label: "100% Secure", icon: ShieldCheck },
  { label: "KYC Verified", icon: BadgeCheck },
  { label: "Escrow Protected", icon: Lock },
  { label: "Fast Matching", icon: Zap },
];

const HIGHLIGHTS = [
  { icon: Lock, title: "Escrow-secured payments", body: "Funds stay protected until you approve the finished work." },
  { icon: BadgeCheck, title: "KYC-verified professionals", body: "Every profile passes Aadhaar & PAN identity checks." },
  { icon: MessageCircle, title: "Real-time chat", body: "Discuss scope and details directly, before you hire." },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            India&apos;s KYC-Verified Freelance &amp; Local Services Marketplace
          </span>

          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Find Work.
            <br />
            Get Hired.
            <br />
            <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
              Build Together.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            WorkQuora connects verified clients with skilled freelancers and local service
            professionals across India. Every user is KYC verified, every payment is secured
            in escrow, and every project is built on trust.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`${SPA_URL}/auth?mode=register`}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              I Want to Hire <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <Link
              href={`${SPA_URL}/auth?mode=register`}
              className="inline-flex items-center rounded-full border border-border bg-surface px-7 py-3.5 text-sm font-semibold text-primary transition-colors hover:border-primary"
            >
              I Want to Work
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {TRUST_ROW.map((t) => (
              <li key={t.label} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <t.icon className="h-4 w-4 text-primary" />
                {t.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Product highlights panel — code-drawn, no stock photo/screenshot */}
        <div className="relative mx-auto w-full max-w-lg">
          <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-surface to-surface-2 p-8 shadow-2xl shadow-primary/10">
            <div className="space-y-5">
              {HIGHLIGHTS.map((h) => (
                <div key={h.title} className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <h.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{h.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{h.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

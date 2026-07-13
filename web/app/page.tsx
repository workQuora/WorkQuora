import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Zap, Globe2, Briefcase, Users, ArrowRight, FileEdit, UserCheck, Lock, MapPin, Wallet } from "lucide-react";
import { SITE_URL, SPA_URL } from "@/lib/constants";
import { SERVICES } from "@/lib/services";

export const metadata: Metadata = {
  // Root page.tsx shares its route segment with the root layout, so
  // layout's title.template doesn't apply here (per Next.js metadata
  // rules) — the brand name has to be included explicitly.
  title: "WorkQuora — Find Work. Get Hired. Build Together.",
  description:
    "WorkQuora is India's KYC-verified freelance and local services marketplace. Post a job or find work with escrow-protected payments, verified profiles, and real-time chat.",
  alternates: { canonical: SITE_URL },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "WorkQuora",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SPA_URL}/discover?keyword={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    title: "100% Secure & Verified",
    desc: "All users are identity and payment verified to ensure a trustworthy environment.",
  },
  {
    icon: Zap,
    title: "Lightning Fast Matching",
    desc: "Our AI-driven engine connects clients with the best local freelancers instantly.",
  },
  {
    icon: Globe2,
    title: "Local & Global Reach",
    desc: "Find opportunities right in your neighborhood or work with clients worldwide.",
  },
];

const CLIENT_STEPS = [
  {
    icon: FileEdit,
    title: "Post your requirement",
    desc: "Tell us what work you need done and your budget — takes under a minute.",
  },
  {
    icon: UserCheck,
    title: "Browse verified workers",
    desc: "See KYC-verified profiles and ratings from real completed jobs before you hire.",
  },
  {
    icon: Lock,
    title: "Pay securely via escrow",
    desc: "Your payment releases only once you approve the finished work.",
  },
];

const WORKER_STEPS = [
  {
    icon: UserCheck,
    title: "Complete KYC",
    desc: "A one-time check — Aadhaar, PAN, bank account, and a selfie.",
  },
  {
    icon: MapPin,
    title: "Browse local jobs",
    desc: "Find work in your own city, on your own terms.",
  },
  {
    icon: Wallet,
    title: "Complete & get paid",
    desc: "Payment credits instantly to your wallet from escrow once the job is done.",
  },
];

const TRUST_STRIP = [
  { title: "KYC Verified", desc: "Secure digital identity checks linked to Aadhaar & PAN verification." },
  { title: "Secure Payments", desc: "Safe deposit holding in digital escrow with UPI bank settlements." },
  { title: "Real-time Chat", desc: "Integrated communication pipeline with instant chat support." },
  { title: "On-time Payments", desc: "Milestone tracking makes sure workers are paid on time." },
  { title: "Low Fees", desc: "Low platform commissions mean you take home more of your income." },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary sm:text-sm">
          India&apos;s KYC-Verified Freelance &amp; Local Services Marketplace
        </span>

        <h1 className="mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
          Find Work. Get Hired.{" "}
          <span className="bg-gradient-to-r from-primary via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
            Build Together.
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          WorkQuora connects verified clients with skilled freelancers and local service
          professionals across India. Every user completes Aadhaar- and PAN-based KYC
          verification, so you always know who you&apos;re working with, and every payment is
          held securely in escrow until work is approved. Whether you&apos;re hiring a
          developer, a designer, or a local service provider, post a job or browse verified
          profiles and get to work — safely, quickly, locally or remotely.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={`${SPA_URL}/auth?mode=register`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 sm:px-8 sm:py-4 sm:text-base"
          >
            I Want to Hire <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </a>
          <a
            href={`${SPA_URL}/auth?mode=register`}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary/20 bg-surface px-6 py-3.5 text-sm font-bold text-primary transition-colors hover:border-primary/50 sm:px-8 sm:py-4 sm:text-base"
          >
            I Want to Work
          </a>
        </div>
      </section>

      {/* Popular services */}
      <section className="border-t border-border py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
            Popular Services
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <a
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-5 text-center transition-colors hover:border-primary/40"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold">{service.name}</span>
                </a>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              See All Services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section A: For Clients */}
      <section className="border-t border-border py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
            For Clients: Hire in 3 Steps
          </h2>
          <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {CLIENT_STEPS.map((step, i) => (
              <div key={step.title} className="rounded-2xl border border-border bg-surface p-6 text-center">
                <span className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {i + 1}
                </span>
                <step.icon className="mx-auto mb-3 h-6 w-6 text-primary" />
                <h3 className="mb-1.5 text-sm font-bold">{step.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <a
              href={`${SPA_URL}/auth?mode=register`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
            >
              Post a Job <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Section B: For Workers */}
      <section className="border-t border-border bg-surface-2 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
            For Workers: Find Work Your Way
          </h2>
          <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {WORKER_STEPS.map((step, i) => (
              <div key={step.title} className="rounded-2xl border border-border bg-surface p-6 text-center">
                <span className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <step.icon className="mx-auto mb-3 h-6 w-6 text-emerald-600" />
                <h3 className="mb-1.5 text-sm font-bold">{step.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mb-8 max-w-xl rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
            <p className="mb-1.5 text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
              Jab mann kiya on karo, jab chaho off — no pressure
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Work in your own city, on your own schedule, whenever you want. No fixed shifts, no
              travel to another city required.
            </p>
          </div>

          <div className="text-center">
            <a
              href={`${SPA_URL}/auth?mode=register`}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
            >
              Start Earning <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-t border-border py-14 sm:py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 sm:grid-cols-3 sm:px-6">
          {TRUST_BADGES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-1.5 text-base font-bold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works preview */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
            Step-by-Step Guide
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">How WorkQuora Works</h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-6 rounded-3xl border border-border bg-surface p-8 shadow-sm sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="mb-2 text-2xl font-extrabold">Hire Top Talent</h3>
              <p className="text-sm text-muted-foreground">Find the right professional for your work.</p>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Post your requirement in seconds
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Review verified professional profiles
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Communicate clearly via real-time chat
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Complete jobs securely using digital escrow
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-6 rounded-3xl border border-border bg-surface p-8 shadow-sm sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="mb-2 text-2xl font-extrabold">Find Work</h3>
              <p className="text-sm text-muted-foreground">Discover opportunities that match your skills.</p>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                Create your professional work profile
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                Explore verified opportunities in your area
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                Connect directly with local clients
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                Get paid instantly to your wallet ledger
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="/how-it-works" className="text-sm font-bold text-primary hover:underline">
            See the full step-by-step guide →
          </a>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-border bg-surface-2 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {TRUST_STRIP.map(({ title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-surface p-5">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider">{title}</h4>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a href="/trust-safety" className="text-sm font-bold text-primary hover:underline">
              Read our full Trust &amp; Safety policy →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

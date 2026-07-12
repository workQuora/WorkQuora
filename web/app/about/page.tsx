import type { Metadata } from "next";
import { ShieldCheck, Target, Users } from "lucide-react";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "WorkQuora is India's KYC-verified freelance and local services marketplace, built to make hiring and getting hired safe, fast, and fair.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">About Us</p>
      <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
        Building a safer way to hire and get hired in India
      </h1>
      <p className="mb-12 text-lg leading-relaxed text-muted-foreground">
        WorkQuora is a KYC-verified marketplace that connects clients with freelancers and
        local service professionals across India. Every user on the platform verifies their
        identity through Aadhaar and PAN before they can post a job, submit a proposal, or
        get paid — and every payment moves through escrow, held safely until both sides agree
        the work is done. We built WorkQuora because hiring someone you&apos;ve never met, or
        working for a client you can&apos;t verify, shouldn&apos;t require blind trust.
      </p>

      <div className="mb-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <ShieldCheck className="mb-3 h-6 w-6 text-primary" />
          <h3 className="mb-1.5 text-sm font-bold">Verified by default</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            KYC isn&apos;t optional on WorkQuora — it&apos;s how the platform works.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <Target className="mb-3 h-6 w-6 text-primary" />
          <h3 className="mb-1.5 text-sm font-bold">Built for local + remote</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Hire a nearby electrician or a remote developer — same platform, same protections.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <Users className="mb-3 h-6 w-6 text-primary" />
          <h3 className="mb-1.5 text-sm font-bold">Fair to both sides</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Escrow protects clients from bad work and freelancers from non-payment, equally.
          </p>
        </div>
      </div>

      <h2 className="mb-4 text-2xl font-extrabold tracking-tight">Our Mission</h2>
      <p className="mb-10 leading-relaxed text-muted-foreground">
        India has millions of skilled freelancers and local service providers, and just as
        many clients who need reliable help — but the trust gap between them is real. Fake
        profiles, unpaid invoices, and no-show contractors are common enough that most people
        default to hiring only within their own network. WorkQuora&apos;s mission is to close
        that trust gap with verified identities, transparent pricing, and payments that are
        never released until the work is actually approved, so that hiring a stranger for a
        job feels as safe as hiring someone you already know.
      </p>

      <h2 className="mb-4 text-2xl font-extrabold tracking-tight">A Note From Our Team</h2>
      <p className="leading-relaxed text-muted-foreground">
        This section is where we&apos;ll share the story of why WorkQuora was started and
        who&apos;s building it — we&apos;re holding that space for a proper founder&apos;s
        note rather than publishing a placeholder bio. In the meantime, you can reach the team
        directly at{" "}
        <a href="mailto:support@workquora.com" className="font-semibold text-primary hover:underline">
          support@workquora.com
        </a>
        .
      </p>
    </section>
  );
}

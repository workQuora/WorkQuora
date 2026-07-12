import type { Metadata } from "next";
import { ShieldCheck, MapPin, Users } from "lucide-react";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "WorkQuora is India's KYC-verified local work marketplace, built so skilled workers can find real jobs in their own city — on their own terms.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">About Us</p>
      <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
        Built so skilled workers don&apos;t have to leave their city for work
      </h1>
      <p className="mb-12 text-lg leading-relaxed text-muted-foreground">
        WorkQuora is a KYC-verified marketplace connecting clients with local workers —
        plumbers, electricians, cooks, painters, carpenters, and more — in their own city.
        Every worker verifies their identity through Aadhaar, PAN, bank details, and a selfie
        check before they can take a job, and every payment is held safely in escrow until the
        client approves the completed work. We built WorkQuora because too many skilled workers
        have had to leave home and move to a bigger city just to find steady work, when the
        real problem was simply not having a reliable way for nearby clients to find and trust
        them.
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
          <MapPin className="mb-3 h-6 w-6 text-primary" />
          <h3 className="mb-1.5 text-sm font-bold">Local-first</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Built around work in your own city — no need to relocate to find steady clients.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <Users className="mb-3 h-6 w-6 text-primary" />
          <h3 className="mb-1.5 text-sm font-bold">Fair to both sides</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Escrow protects clients from bad work and workers from non-payment, equally.
          </p>
        </div>
      </div>

      <h2 className="mb-4 text-2xl font-extrabold tracking-tight">Our Mission</h2>
      <p className="mb-6 leading-relaxed text-muted-foreground">
        India has millions of skilled workers — tradespeople, cooks, and local service
        professionals — and just as many households and businesses nearby who need reliable
        help. The gap between them usually isn&apos;t a lack of skill or a lack of demand,
        it&apos;s trust: clients don&apos;t know who&apos;s actually reliable, and workers don&apos;t
        have a steady way to reach clients without relying entirely on word of mouth. WorkQuora&apos;s
        mission is simple: every skilled worker in India should have access to a verified
        platform where they can find real work close to home, on their own schedule — no
        middleman, no need to move to a different city to make a living.
      </p>

      <div className="mb-14 rounded-2xl border border-border bg-surface-2 p-6 text-center">
        <p className="text-sm font-bold text-foreground">
          Growing community of workers and clients across India
        </p>
      </div>

      <h2 className="mb-4 text-2xl font-extrabold tracking-tight">A Note From Our Team</h2>
      <p className="leading-relaxed text-muted-foreground">
        WorkQuora is built by a solo developer who believes skilled workers deserve better
        opportunities in their own city — that&apos;s the honest version of our founding story,
        and we&apos;d rather tell you that than publish a polished bio that isn&apos;t real. If
        you want to reach out directly, email{" "}
        <a href="mailto:support@workquora.com" className="font-semibold text-primary hover:underline">
          support@workquora.com
        </a>
        .
      </p>
    </section>
  );
}

import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "WorkQuora's Terms of Service.",
  alternates: { canonical: `${SITE_URL}/terms` },
  // Placeholder content — don't let an incomplete legal page get indexed
  // and mistaken for the real terms. Remove once final copy is in place.
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Terms of Service</h1>
      <p className="mb-6 leading-relaxed text-muted-foreground">
        Our full Terms of Service are being finalized and will be published here. In the
        meantime, WorkQuora&apos;s marketplace operates on the core principle that every job is
        backed by KYC-verified users and escrow-protected payments, as described on our{" "}
        <a href="/trust-safety" className="font-semibold text-primary hover:underline">
          Trust &amp; Safety
        </a>{" "}
        page.
      </p>
      <p className="text-sm text-muted-foreground">
        For questions in the meantime, contact{" "}
        <a href="mailto:support@workquora.com" className="font-semibold text-primary hover:underline">
          support@workquora.com
        </a>
        .
      </p>
    </section>
  );
}

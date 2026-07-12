import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "WorkQuora's Privacy Policy.",
  alternates: { canonical: `${SITE_URL}/privacy` },
  // Placeholder content — don't let an incomplete legal page get indexed
  // and mistaken for the real policy. Remove once final copy is in place.
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Privacy Policy</h1>
      <p className="mb-6 leading-relaxed text-muted-foreground">
        Our full Privacy Policy is being finalized and will be published here. WorkQuora
        collects KYC documents (Aadhaar, PAN, bank details, and a selfie) solely to verify
        user identity for marketplace safety, as described on our{" "}
        <a href="/trust-safety" className="font-semibold text-primary hover:underline">
          Trust &amp; Safety
        </a>{" "}
        page. These documents are stored encrypted and are never shown to other users.
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

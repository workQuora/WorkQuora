import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How WorkQuora collects, stores, and shares your data — including KYC handling, IT Act 2000 & IT Rules 2021 compliance, and your rights over your data.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

const EFFECTIVE_DATE = "July 12, 2026";
const LAST_UPDATED = "July 12, 2026";

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
        Legal
      </p>
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
        Privacy Policy
      </h1>
      <p className="mb-12 text-sm font-medium text-muted-foreground">
        Effective Date: {EFFECTIVE_DATE} &nbsp;•&nbsp; Last Updated: {LAST_UPDATED}
      </p>

      <p className="mb-12 leading-relaxed text-muted-foreground">
        This Privacy Policy explains what data WorkQuora collects, why we collect it, how it is
        stored and shared, and the rights you have over it. This policy is drafted to be
        consistent with the Information Technology Act, 2000 and the Information Technology
        (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information)
        Rules, 2021 (&quot;IT Rules 2021&quot;). By using WorkQuora, you consent to the data
        practices described here.
      </p>

      <div className="space-y-12">
        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">1. Data We Collect</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            We collect the following categories of information:
          </p>
          <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span><strong className="text-foreground">Identity details</strong> — your name, email address, mobile number, gender, and username.</span></li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span><strong className="text-foreground">Government ID (KYC)</strong> — Aadhaar number/details and PAN details, submitted for identity verification.</span></li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span><strong className="text-foreground">Bank details</strong> — bank account and IFSC information, used to process worker payouts.</span></li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span><strong className="text-foreground">Location data</strong> — your city/area, used to match clients with nearby workers.</span></li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span><strong className="text-foreground">Device &amp; usage data</strong> — device type, IP address, browser, and how you interact with the Platform, for security and fraud prevention.</span></li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span><strong className="text-foreground">A selfie photo</strong> — used once, during KYC, to match against your submitted ID document.</span></li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">2. Why We Collect It</h2>
          <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />To verify your identity through KYC, so both clients and workers can trust who they&apos;re transacting with.</li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />To process escrow payments and worker payouts to the correct, verified bank account.</li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />To match clients with nearby, relevant workers based on location and skills.</li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />To send account, job, and payment notifications by email or SMS.</li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />To detect fraud, prevent abuse, and keep the Platform secure.</li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />To comply with legal and regulatory obligations under Indian law.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">3. How We Store It</h2>
          <p className="leading-relaxed text-muted-foreground">
            Account and transactional data is stored in <strong className="text-foreground">MongoDB</strong>,
            our primary database. Photos and documents — including KYC images and profile pictures
            — are stored on <strong className="text-foreground">Cloudinary</strong>, a dedicated
            media storage provider. Sensitive personal data, including KYC identifiers and bank
            details, is encrypted at rest and in transit. Access to this data internally is
            restricted to systems and personnel that need it to operate the Platform — it is never
            exposed to other users.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">4. Who We Share It With</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            We do not sell your personal data. We share specific data with the following
            third-party service providers, only as needed to operate the Platform:
          </p>
          <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span><strong className="text-foreground">Razorpay</strong> — processes escrow payments and worker payouts; receives transaction and bank details necessary to move funds.</span></li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span><strong className="text-foreground">Fast2SMS</strong> — sends OTP and transactional SMS messages; receives your mobile number.</span></li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span><strong className="text-foreground">Resend</strong> — sends transactional emails (OTP, notifications, receipts); receives your email address.</span></li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span><strong className="text-foreground">Cloudinary</strong> — stores uploaded photos and documents, as described in Section 3.</span></li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            We may also disclose data where required by law, court order, or a valid request from
            a government or regulatory authority.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">5. Data Retention</h2>
          <p className="leading-relaxed text-muted-foreground">
            We retain your account and transaction data for as long as your account is active, and
            for a reasonable period afterward to meet legal, tax, and accounting obligations
            (typically up to 7 years for financial transaction records, in line with Indian
            regulatory record-keeping norms). KYC documents are retained for as long as your
            account remains active plus the same retention window, after which they are deleted
            or irreversibly anonymized unless we are legally required to retain them longer.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">6. Your Rights</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            You have the right to:
          </p>
          <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span><strong className="text-foreground">Access</strong> the personal data we hold about you.</span></li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span><strong className="text-foreground">Correct</strong> inaccurate or outdated information on your profile or KYC records.</span></li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span><strong className="text-foreground">Request deletion</strong> of your account and associated personal data, subject to our legal retention obligations described in Section 5.</span></li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            To exercise any of these rights, email{" "}
            <a href="mailto:support@workquora.com" className="font-semibold text-primary hover:underline">
              support@workquora.com
            </a>{" "}
            from your registered email address. We will respond within a reasonable timeframe and
            in line with applicable law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">7. KYC Data Handling</h2>
          <p className="leading-relaxed text-muted-foreground">
            Aadhaar, PAN, bank details, and your selfie photo are treated as sensitive personal
            data under the IT Rules 2021 and are handled with additional safeguards: they are
            encrypted, access-restricted to verification systems and authorized personnel only,
            never displayed to other users on the Platform, and never used for any purpose beyond
            identity verification, payout processing, and fraud prevention. Only your verified
            status (a badge) is shown publicly on your profile — never the underlying documents
            or numbers.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">8. Cookies Policy</h2>
          <p className="leading-relaxed text-muted-foreground">
            We use essential cookies and local storage to keep you signed in, remember your theme
            preference, and keep the Platform functioning correctly. We do not use third-party
            advertising or tracking cookies. You can disable cookies through your browser
            settings, but doing so may prevent parts of WorkQuora — such as staying logged in —
            from working correctly.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">9. Contact for Privacy Concerns</h2>
          <p className="leading-relaxed text-muted-foreground">
            Questions, concerns, or requests regarding your personal data can be sent to{" "}
            <a href="mailto:support@workquora.com" className="font-semibold text-primary hover:underline">
              support@workquora.com
            </a>
            .
          </p>
        </section>
      </div>
    </section>
  );
}

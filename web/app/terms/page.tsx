import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "WorkQuora's Terms of Service — eligibility, KYC requirements, escrow payments, the 12% platform commission, prohibited activities, and dispute resolution.",
  alternates: { canonical: `${SITE_URL}/terms` },
};

const EFFECTIVE_DATE = "July 12, 2026";
const LAST_UPDATED = "July 12, 2026";

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
        Legal
      </p>
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
        Terms of Service
      </h1>
      <p className="mb-12 text-sm font-medium text-muted-foreground">
        Effective Date: {EFFECTIVE_DATE} &nbsp;•&nbsp; Last Updated: {LAST_UPDATED}
      </p>

      <p className="mb-12 leading-relaxed text-muted-foreground">
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of WorkQuora
        (&quot;WorkQuora&quot;, &quot;the Platform&quot;, &quot;we&quot;, &quot;us&quot;). By creating an
        account, you agree to be bound by these Terms. If you do not agree, do not use the
        Platform. We&apos;ve written these in plain language wherever possible, because you
        should actually understand what you&apos;re agreeing to.
      </p>

      <div className="space-y-12">
        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">1. Platform Overview</h2>
          <p className="leading-relaxed text-muted-foreground">
            WorkQuora is a KYC-verified marketplace that connects two kinds of users: clients who
            need work done, and workers/freelancers who offer skilled services — plumbing,
            electrical work, cooking, painting, carpentry, and general freelance project work
            among others. WorkQuora is not an employer of workers or freelancers, and is not a
            party to the underlying work agreement between a client and a worker. We provide the
            platform, identity verification, escrow payment handling, messaging, and dispute
            support that make it safe for both sides to transact.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">2. Eligibility</h2>
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>
                You must be at least <strong className="text-foreground">18 years old</strong> to
                create an account or use WorkQuora, whether as a client or a worker/freelancer.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>
                You must complete <strong className="text-foreground">KYC (Know Your Customer)
                verification</strong> before you can post a job, submit a proposal, accept work,
                or receive a payout. Accounts that have not completed KYC have restricted access
                to the Platform.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>
                You must provide accurate, current information when registering and completing
                KYC. Providing false identity documents or impersonating another person is a
                violation of these Terms and may be reported to the appropriate authorities.
              </span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">3. User Responsibilities</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            Both clients and workers are expected to act in good faith. Specifically:
          </p>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-foreground">
            If you&apos;re hiring (Client)
          </h3>
          <ul className="mb-5 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Post accurate job descriptions and fund escrow promptly once you hire a worker.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Review and release payment for completed work in good faith, without unreasonable delay.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Communicate and pay only through WorkQuora — not off-platform — so escrow and dispute protections apply.
            </li>
          </ul>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-foreground">
            If you&apos;re working (Worker / Freelancer)
          </h3>
          <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Complete KYC verification before accepting jobs or requesting payouts.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Deliver work as described and agreed with the client, and communicate delays honestly.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Only request payment release through escrow once the agreed work is actually delivered.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">4. KYC Requirements</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            Every user who wants full access to WorkQuora — posting jobs, submitting proposals,
            accepting work, or withdrawing funds — must complete a five-step identity
            verification:
          </p>
          <ol className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-3">
              <span className="font-bold text-primary">1.</span>
              <span><strong className="text-foreground">Mobile OTP verification</strong> — confirms the phone number behind your account is real and reachable.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">2.</span>
              <span><strong className="text-foreground">Aadhaar verification</strong> — confirms a real, government-issued identity behind your account.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">3.</span>
              <span><strong className="text-foreground">PAN verification</strong> — links your account to a verifiable financial identity, required before any payout.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">4.</span>
              <span><strong className="text-foreground">Bank account verification</strong> — confirms payouts go to an account that actually belongs to you.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">5.</span>
              <span><strong className="text-foreground">Selfie liveness check</strong> — matches the person behind the account to the submitted ID documents.</span>
            </li>
          </ol>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            KYC documents are reviewed for verification purposes only, stored encrypted, and
            never shown to other users — only your verified badge is public. See our{" "}
            <a href="/privacy" className="font-semibold text-primary hover:underline">
              Privacy Policy
            </a>{" "}
            for full detail on how this data is handled.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">5. Escrow Payment Process</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            All payments on WorkQuora move through escrow — client funds are never paid directly
            to a worker outside this process:
          </p>
          <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              When a client hires a worker, the agreed amount is deposited into WorkQuora&apos;s escrow and held securely for the duration of the job.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              The worker can see the job is funded before starting, so there&apos;s no risk of working without payment secured.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              The client retains control of the funds until they approve the delivered work.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              On approval, funds (minus the platform commission described below) release to the worker&apos;s WorkQuora wallet, ready for withdrawal to their verified bank account.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              If a disagreement arises before release, either party can open a dispute — see Section 8.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">6. Fees &amp; Commission</h2>
          <p className="leading-relaxed text-muted-foreground">
            WorkQuora charges <strong className="text-foreground">12% platform commission per
            completed transaction</strong>. This commission is deducted from the escrowed amount
            at the time funds are released to the worker, after the client approves the completed
            work. There are no hidden fees beyond this commission — the amount a worker sees
            released to their wallet is the job amount minus this 12% commission, and nothing
            else.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">7. Prohibited Activities</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">The following are not allowed on WorkQuora:</p>
          <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />Circumventing escrow by requesting or making payments outside the Platform for a job arranged through WorkQuora.</li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />Submitting false, forged, or stolen identity documents during KYC.</li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />Creating multiple accounts to evade a suspension, ban, or negative rating history.</li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />Harassment, threats, discriminatory behavior, or abusive conduct toward other users.</li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />Posting jobs or offering services that are illegal under Indian law.</li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />Attempting to manipulate ratings, reviews, or job/proposal data through fake accounts or coordinated abuse.</li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />Scraping, reverse-engineering, or interfering with the normal operation of the Platform.</li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Violating these terms may result in a warning, suspension, permanent ban, forfeiture
            of pending payouts related to the violation, and — where the conduct is unlawful —
            referral to law enforcement.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">8. Dispute Resolution Process</h2>
          <p className="leading-relaxed text-muted-foreground">
            If a client and worker disagree about whether work was completed satisfactorily,
            either side can open a dispute before escrow funds are released. WorkQuora&apos;s team
            reviews the job details, delivered work, and in-platform chat history relevant to the
            job, then makes a decision on how the escrowed funds should be split between a client
            refund and a worker payout. We aim to resolve disputes fairly and based on the
            evidence available on-platform, which is why keeping communication and deliverables
            within WorkQuora (rather than off-platform) matters — it&apos;s what we&apos;re able to
            review.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">9. Limitation of Liability</h2>
          <p className="leading-relaxed text-muted-foreground">
            WorkQuora provides the platform, identity verification, and escrow infrastructure
            that make transactions between clients and workers safer — but we are not a party to,
            and do not guarantee the outcome of, the underlying work agreement between a client
            and a worker. To the maximum extent permitted by Indian law, WorkQuora is not liable
            for indirect, incidental, or consequential damages arising from the quality of work
            performed, a user&apos;s conduct, or a user&apos;s failure to fulfil their obligations to
            another user. Our liability in connection with the Platform is limited to the
            commission amount actually collected on the transaction giving rise to the claim.
            Nothing in this section limits liability that cannot be limited under applicable law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">10. Governing Law</h2>
          <p className="leading-relaxed text-muted-foreground">
            These Terms are governed by the laws of India. Any dispute arising out of or relating
            to these Terms or your use of WorkQuora shall be subject to the exclusive
            jurisdiction of the competent courts in <strong className="text-foreground">Bhopal,
            Madhya Pradesh, India</strong>.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">11. Changes to Terms</h2>
          <p className="leading-relaxed text-muted-foreground">
            We may update these Terms from time to time — to reflect changes to the Platform, new
            features, or legal requirements. When we make a material change, we will notify you
            (via email, in-app notice, or an equivalent method) before or at the time the change
            takes effect, and update the &quot;Last Updated&quot; date at the top of this page.
            Continued use of WorkQuora after a change takes effect constitutes acceptance of the
            updated Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">12. Contact</h2>
          <p className="leading-relaxed text-muted-foreground">
            Questions about these Terms? Reach us at{" "}
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

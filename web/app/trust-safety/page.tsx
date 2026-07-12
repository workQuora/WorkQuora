import type { Metadata } from "next";
import { ShieldCheck, Lock, UserCheck, ScaleIcon } from "lucide-react";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Trust & Safety",
  description:
    "How WorkQuora keeps every job safe: mandatory Aadhaar/PAN KYC verification, escrow-held payments, verified profiles, and fair dispute resolution.",
  alternates: { canonical: `${SITE_URL}/trust-safety` },
};

export default function TrustSafetyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
        Trust &amp; Safety
      </p>
      <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
        Every job on WorkQuora is protected by design
      </h1>
      <p className="mb-14 text-lg leading-relaxed text-muted-foreground">
        Trust isn&apos;t a feature we bolted on — it&apos;s the reason WorkQuora exists.
        Identity verification and escrow-held payments are built into every job, for every
        user, with no way to opt out. Here&apos;s exactly how each protection works.
      </p>

      {/* KYC */}
      <div className="mb-14">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <UserCheck className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">KYC Verification</h2>
        </div>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Before anyone can post a job, submit a proposal, or receive a payout, they complete a
          five-step identity check:
        </p>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span><strong className="text-foreground">Mobile OTP verification</strong> — confirms the phone number behind the account is real and reachable, the first step for every new user.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span><strong className="text-foreground">Aadhaar verification</strong> — confirms a real, government-issued identity behind every account.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span><strong className="text-foreground">PAN verification</strong> — links the account to a verifiable financial identity, required before any payout.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span><strong className="text-foreground">Bank account verification</strong> — confirms payouts go to an account that actually belongs to the verified user.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span><strong className="text-foreground">Selfie liveness check</strong> — matches the person behind the account to their submitted ID, to catch stolen or fake documents.</span>
          </li>
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Each step is reviewed individually, and a profile only shows as fully KYC-verified once
          all five pass. Documents are stored encrypted and are never shown to other users —
          only the verified badge is public.
        </p>
      </div>

      {/* Escrow */}
      <div className="mb-14">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Escrow-Protected Payments</h2>
        </div>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          When a client hires a freelancer, the agreed budget is deposited into WorkQuora&apos;s
          escrow — not paid to the freelancer directly. That money is held in a secure balance
          for the life of the job:
        </p>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            The freelancer can see the job is funded before starting work, so there&apos;s no risk of working for free.
          </li>
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            The client keeps control of the funds until they approve the delivered work — no upfront risk of paying for nothing.
          </li>
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            On approval, funds release straight to the freelancer&apos;s WorkQuora wallet, ready for withdrawal to their verified bank account.
          </li>
        </ul>
      </div>

      {/* Verified profiles */}
      <div className="mb-14">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Verified Profiles &amp; Ratings</h2>
        </div>
        <p className="leading-relaxed text-muted-foreground">
          Every profile shows a clear KYC status, a rating built from real completed jobs, and a
          review history from past clients or freelancers. Because reviews are only left after a
          job is marked complete through escrow, ratings reflect actual finished work rather than
          unverified testimonials.
        </p>
      </div>

      {/* Disputes */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <ScaleIcon className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Fair Dispute Resolution</h2>
        </div>
        <p className="leading-relaxed text-muted-foreground">
          If a client and freelancer disagree about whether work was completed satisfactorily,
          either side can open a dispute before escrow funds are released. WorkQuora&apos;s team
          reviews the job details, delivered work, and chat history, then decides how the
          escrowed funds should be split between the client refund and freelancer payout — so
          neither side is left with no recourse when something goes wrong.
        </p>
      </div>
    </section>
  );
}

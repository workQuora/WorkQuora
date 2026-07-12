import type { Metadata } from "next";
import { Briefcase, Users } from "lucide-react";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How WorkQuora works for clients and freelancers: post a job or complete KYC, hire or bid, work through escrow-protected milestones, and get paid.",
  alternates: { canonical: `${SITE_URL}/how-it-works` },
};

const CLIENT_STEPS = [
  {
    title: "Post your job",
    desc: "Describe what you need done, set a budget range, and publish your job in seconds — no sign-up friction beyond basic KYC.",
  },
  {
    title: "Review proposals & hire",
    desc: "Compare bids from KYC-verified freelancers, check their profiles and ratings, and accept the one that fits your job and budget.",
  },
  {
    title: "Fund escrow",
    desc: "Your payment is deposited into WorkQuora's escrow and held securely — the freelancer can see it's funded, but can't withdraw it until you approve the work.",
  },
  {
    title: "Track & complete",
    desc: "Communicate through real-time chat, track milestones as they're delivered, and release payment from escrow once you're satisfied with the completed work.",
  },
];

const WORKER_STEPS = [
  {
    title: "Complete KYC",
    desc: "Verify your identity with Aadhaar, PAN, a bank account, and a selfie check. This is what lets clients trust your profile before they've ever met you.",
  },
  {
    title: "Browse jobs",
    desc: "Search open jobs by category, location, or budget, and find work that matches your skills — locally nearby or fully remote.",
  },
  {
    title: "Submit a bid",
    desc: "Send a proposal with your price and timeline. Clients can message you directly to discuss scope before accepting.",
  },
  {
    title: "Get paid",
    desc: "Once the client approves your completed work, payment moves from escrow straight to your WorkQuora wallet — no chasing invoices.",
  },
];

function StepList({
  icon: Icon,
  iconColorClass,
  title,
  subtitle,
  steps,
}: {
  icon: typeof Briefcase;
  iconColorClass: string;
  title: string;
  subtitle: string;
  steps: { title: string; desc: string }[];
}) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border bg-current/10 ${iconColorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="mb-1.5 text-2xl font-extrabold tracking-tight text-foreground">{title}</h2>
      <p className="mb-8 text-sm text-muted-foreground">{subtitle}</p>

      <ol className="space-y-6">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                iconColorClass.includes("emerald") ? "bg-emerald-600" : "bg-primary"
              }`}
            >
              {i + 1}
            </span>
            <div>
              <h3 className="mb-1 text-sm font-bold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-12 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
          Step-by-Step Guide
        </p>
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
          How WorkQuora Works
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground">
          Whether you&apos;re hiring or looking for work, every job on WorkQuora goes through
          the same core protections: verified identities before anyone can transact, and
          escrow-held payments that only release when the work is actually approved. Here&apos;s
          exactly how each side of the process works.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <StepList
          icon={Briefcase}
          iconColorClass="text-primary border-primary/20"
          title="For Clients"
          subtitle="Hire verified talent and only pay for approved work."
          steps={CLIENT_STEPS}
        />
        <StepList
          icon={Users}
          iconColorClass="text-emerald-600 border-emerald-500/20"
          title="For Freelancers"
          subtitle="Get verified, find work, and get paid reliably."
          steps={WORKER_STEPS}
        />
      </div>

      <div className="mt-14 rounded-3xl border border-border bg-surface-2 p-8 text-center sm:p-10">
        <h2 className="mb-2 text-xl font-extrabold">Why escrow matters</h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Escrow is the core of how WorkQuora builds trust between strangers. When a client
          funds a job, that money moves into a secure holding balance — the freelancer can see
          the job is funded and safe to start, but the money isn&apos;t released until the
          client approves the completed work. If there&apos;s a dispute, WorkQuora&apos;s team
          reviews the case and splits or releases funds fairly, rather than leaving either side
          with no recourse.
        </p>
      </div>
    </section>
  );
}

import Link from "next/link";
import { FileEdit, UserCheck, Lock, ArrowRight } from "lucide-react";
import { WORK_STEPS } from "@/lib/landingData";
import { SPA_URL } from "@/lib/constants";

const ICONS = { post: FileEdit, browse: UserCheck, escrow: Lock };

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">How WorkQuora Works</h2>
        <p className="mt-3 text-muted-foreground">Simple steps for a secure and smooth experience.</p>
      </div>

      <div className="relative mt-14">
        <div aria-hidden className="absolute left-[16%] right-[16%] top-8 hidden h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent lg:block" />

        <ol className="grid gap-6 lg:grid-cols-3">
          {WORK_STEPS.map((step) => {
            const Icon = ICONS[step.icon];
            return (
              <li key={step.n} className="relative rounded-2xl border border-border bg-surface p-7 text-center shadow-sm">
                <span className="relative z-10 mx-auto -mt-14 mb-4 grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md">
                  {step.n}
                </span>
                <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5.5 w-5.5" />
                </span>
                <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          href={`${SPA_URL}/auth?mode=register`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          Post a Job <ArrowRight className="h-4.5 w-4.5" />
        </Link>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Check, ArrowRight, Briefcase, HardHat, type LucideIcon } from "lucide-react";
import { CLIENT_POINTS, WORKER_POINTS } from "@/lib/landingData";
import { SPA_URL } from "@/lib/constants";

function Panel({
  variant,
  title,
  subtitle,
  points,
  icon: Icon,
  cta,
  reverse = false,
}: {
  variant: "client" | "worker";
  title: string;
  subtitle: string;
  points: string[];
  icon: LucideIcon;
  cta: string;
  reverse?: boolean;
}) {
  const isClient = variant === "client";
  return (
    <div
      className={`grid items-center gap-8 rounded-3xl border p-8 sm:grid-cols-2 sm:p-10 ${
        isClient ? "border-primary/20 bg-primary/5" : "border-emerald-500/20 bg-emerald-500/5"
      }`}
    >
      <div className={reverse ? "sm:order-2" : ""}>
        <h3 className={`text-2xl font-extrabold ${isClient ? "text-primary" : "text-emerald-600 dark:text-emerald-400"}`}>
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

        <ul className="mt-6 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm text-foreground">
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                  isClient ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                <Check className="h-3.25 w-3.25" />
              </span>
              {p}
            </li>
          ))}
        </ul>

        <Link
          href={`${SPA_URL}/auth?mode=register`}
          className={`mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 ${
            isClient ? "bg-primary" : "bg-emerald-600"
          }`}
        >
          {cta} <ArrowRight className="h-4.25 w-4.25" />
        </Link>
      </div>

      <div className={`flex justify-center ${reverse ? "sm:order-1" : ""}`}>
        <span
          className={`grid h-40 w-40 place-items-center rounded-full ${
            isClient ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          <Icon className="h-16 w-16" />
        </span>
      </div>
    </div>
  );
}

export default function AudienceSplit() {
  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-5 py-10 lg:grid-cols-2">
      <Panel
        variant="client"
        title="For Clients"
        subtitle="Hire the right talent in minutes."
        points={CLIENT_POINTS}
        icon={Briefcase}
        cta="Post a Job"
      />
      <Panel
        variant="worker"
        title="For Workers"
        subtitle="Find work, earn and grow."
        points={WORKER_POINTS}
        icon={HardHat}
        cta="Start Earning"
        reverse
      />
    </section>
  );
}

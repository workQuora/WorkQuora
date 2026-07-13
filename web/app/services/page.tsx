import type { Metadata } from "next";
import { SERVICES } from "@/lib/services";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  // Root layout's title template ("%s | WorkQuora") appends the suffix —
  // this renders as the requested "All Services | WorkQuora".
  title: "All Services",
  description:
    "Browse every service available on WorkQuora — verified plumbers, electricians, AC technicians, maids, carpenters, painters, and cooks near you, with escrow-protected payments.",
  alternates: { canonical: `${SITE_URL}/services` },
};

export default function ServicesPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
        Services
      </p>
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
        All Services
      </h1>
      <p className="mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Every service verified workers offer on WorkQuora today — book a job, get matched
        with a KYC-verified local worker, and pay only once you approve the finished work.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <a
              key={service.slug}
              href={`/services/${service.slug}`}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-center transition-colors hover:border-primary/40"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold">{service.name}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {service.shortDescription}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

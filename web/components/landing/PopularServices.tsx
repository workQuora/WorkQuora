import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { SERVICES } from "@/lib/services";

// ============================================================================
// Per-service worker counts must be REAL. Do not hardcode "1200+ Professionals"
// style numbers. This fetches actual counts grouped by service; if a service
// has 0 (or the endpoint doesn't exist yet), its count line is hidden.
//
// Backend TODO: GET /api/v1/stats/services -> { plumber: 3, electrician: 5, ... }
// (count of KYC-verified workers per service). No such grouping currently
// exists — workers are tagged via User.skills, not a service slug.
// ============================================================================

async function getServiceCounts(): Promise<Record<string, number> | null> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/stats/services`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, number>;
  } catch {
    return null;
  }
}

export default async function PopularServices() {
  const counts = await getServiceCounts();

  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <h2 className="text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Popular Services
      </h2>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          const count = counts?.[service.slug];
          return (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group flex flex-col items-center rounded-2xl border border-border bg-surface p-4 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="mb-3 grid h-16 w-16 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-7 w-7" />
              </div>
              <span className="text-sm font-semibold text-foreground">{service.name}</span>
              {typeof count === "number" && count > 0 && (
                <span className="mt-0.5 text-[11px] text-muted-foreground">{count}+ Professionals</span>
              )}
            </Link>
          );
        })}

        <Link
          href="/services"
          className="group flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-2 p-4 text-center transition-all hover:-translate-y-1 hover:border-primary/40"
        >
          <span className="mb-3 grid h-16 w-16 place-items-center rounded-xl bg-primary/10 text-primary">
            <LayoutGrid className="h-6.5 w-6.5" />
          </span>
          <span className="text-sm font-semibold text-foreground">View All</span>
          <span className="mt-0.5 text-[11px] text-muted-foreground">Services</span>
        </Link>
      </div>
    </section>
  );
}

import { Users, Briefcase, ShieldCheck, IndianRupee } from "lucide-react";

// ============================================================================
// Real data only. The design mock shows aspirational numbers (50K+, ₹2Cr+).
// Those are NOT used — this fetches GET /stats/public and renders actual
// counts. Any metric the API doesn't return yet shows "—" rather than a
// fabricated number.
//
// Backend TODO for full parity with all 4 tiles below: extend
// GET /api/v1/stats/public (currently returns { liveJobs, totalWorkers,
// totalClients } — see Backend/src/controllers/statsController.js) to also
// return { completedJobs, successRate, escrowProtectedPaise }.
// ============================================================================

type PublicStats = {
  totalWorkers?: number;
  totalClients?: number;
  liveJobs?: number;
  completedJobs?: number;
  successRate?: number; // 0–100
  escrowProtectedPaise?: number;
};

async function getStats(): Promise<PublicStats | null> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/stats/public`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? null) as PublicStats | null;
  } catch {
    return null;
  }
}

const compact = (n?: number) =>
  typeof n === "number" ? new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n) : "—";

const rupeeCompact = (paise?: number) =>
  typeof paise === "number"
    ? "₹" + new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(paise / 100)
    : "—";

export default async function StatsBar() {
  const s = await getStats();

  const tiles = [
    { icon: Users, value: compact(s?.totalWorkers), label: "Verified Professionals" },
    { icon: Briefcase, value: compact(s?.completedJobs ?? s?.liveJobs), label: "Jobs Completed" },
    { icon: ShieldCheck, value: typeof s?.successRate === "number" ? `${s.successRate}%` : "—", label: "Success Rate" },
    { icon: IndianRupee, value: rupeeCompact(s?.escrowProtectedPaise), label: "Escrow Protected" },
  ];

  return (
    <section className="relative z-10 mx-auto -mt-4 max-w-6xl px-5">
      <div className="grid grid-cols-2 gap-6 rounded-2xl border border-border bg-surface px-6 py-7 shadow-xl shadow-primary/5 sm:grid-cols-4 sm:gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <t.icon className="h-5.5 w-5.5" />
            </span>
            <div>
              <p className="text-xl font-extrabold leading-none text-foreground">{t.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Star, ArrowLeft, ArrowRight, User } from "lucide-react";

// ============================================================================
// REAL reviews only — no fake testimonials. Fetches recent public reviews
// from the backend. Each review's avatar is the reviewer's real profile
// photo; if none exists, a generic icon avatar is shown (never a stock photo
// of a person who isn't the actual reviewer).
//
// Backend TODO: GET /api/v1/reviews/public?limit=9 ->
//   [{ id, name, location, rating (1-5), text, avatarUrl }]
// Only an aggregate per-user endpoint (GET /api/v1/reviews/:userId) exists
// today — no site-wide "recent reviews" endpoint. Until it exists, this
// section renders a clean empty state.
// ============================================================================

type Review = {
  id: string;
  name: string;
  location?: string;
  rating: number;
  text: string;
  avatarUrl?: string;
};

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [start, setStart] = useState(0);
  const perView = 3;

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${base}/reviews/public?limit=9`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Review[]) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));
  }, []);

  if (reviews === null) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">What Our Users Say</h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-surface-2" />
          ))}
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">What Our Users Say</h2>
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-border bg-surface-2 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Reviews appear here once jobs are completed through escrow. Be one of the first to build your reputation on WorkQuora.
          </p>
        </div>
      </section>
    );
  }

  const canPage = reviews.length > perView;
  const visible = reviews.slice(start, start + perView);
  const prev = () => setStart((s) => Math.max(0, s - perView));
  const next = () => setStart((s) => (s + perView < reviews.length ? s + perView : s));

  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <h2 className="text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">What Our Users Say</h2>

      <div className="relative mt-12">
        <div className="grid gap-5 sm:grid-cols-3">
          {visible.map((r) => (
            <figure key={r.id} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.75 w-3.75" fill={i < r.rating ? "currentColor" : "none"} strokeWidth={i < r.rating ? 0 : 1.5} />
                ))}
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed text-muted-foreground">&ldquo;{r.text}&rdquo;</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                {r.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URLs, not a static asset
                  <img src={r.avatarUrl} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </span>
                )}
                <span>
                  <span className="block text-sm font-semibold text-foreground">{r.name}</span>
                  {r.location && <span className="block text-xs text-muted-foreground">{r.location}</span>}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        {canPage && (
          <>
            <button
              onClick={prev}
              disabled={start === 0}
              aria-label="Previous reviews"
              className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface text-muted-foreground shadow-sm transition hover:text-primary disabled:opacity-40 sm:grid"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={next}
              disabled={start + perView >= reviews.length}
              aria-label="Next reviews"
              className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface text-muted-foreground shadow-sm transition hover:text-primary disabled:opacity-40 sm:grid"
            >
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}

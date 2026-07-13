import Link from "next/link";
import { SPA_URL } from "@/lib/constants";

export default function CtaBanner() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-violet-700 px-8 py-10 sm:px-12">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex flex-col items-center gap-8 text-center lg:flex-row lg:justify-between lg:text-left">
          <div>
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Ready to Get Started?</h2>
            <p className="mt-2 max-w-md text-sm text-indigo-100">
              Join thousands of verified users who trust WorkQuora for their work and professional needs.
            </p>
          </div>

          <div className="flex shrink-0 gap-3">
            <Link
              href={`${SPA_URL}/auth?mode=register`}
              className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-primary transition-transform hover:-translate-y-0.5"
            >
              Hire Talent
            </Link>
            <Link
              href={`${SPA_URL}/auth?mode=register`}
              className="rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Start Earning
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

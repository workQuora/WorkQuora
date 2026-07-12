import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { SERVICES, getServiceBySlug } from "@/lib/services";
import { SITE_URL, SPA_URL } from "@/lib/constants";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};

  const title = `Hire Verified ${service.namePlural} Near You`;
  const description = `${service.shortDescription} Typical rates: ${service.priceRange} ${service.priceUnit}. KYC-verified, escrow-protected payments on WorkQuora.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/services/${service.slug}` },
  };
}

const HOW_IT_WORKS_STEPS = (service: (typeof SERVICES)[number]) => [
  {
    title: "Post your job",
    desc: `Describe what you need done — a ${service.name.toLowerCase()} job takes under a minute to post.`,
  },
  {
    title: "Get matched",
    desc: `See verified ${service.namePlural.toLowerCase()} near you, with ratings from real past jobs.`,
  },
  {
    title: "Work gets done",
    desc: "Chat directly, track progress, and stay in control the whole time.",
  },
  {
    title: "Pay when satisfied",
    desc: "Your payment stays in escrow and only releases once you approve the finished work.",
  },
];

export default async function ServicePage({ params }: Params) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const Icon = service.icon;

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.name,
    name: `${service.name} Services`,
    description: service.shortDescription,
    provider: {
      "@type": "Organization",
      name: "WorkQuora",
      url: SITE_URL,
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    priceRange: `${service.priceRange} ${service.priceUnit}`,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: service.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-8 w-8" />
        </div>

        <h1 className="mb-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Hire Verified {service.namePlural} Near You
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {service.shortDescription} Every {service.name.toLowerCase()} on WorkQuora completes
          5-step KYC verification — mobile, Aadhaar, PAN, bank, and a selfie check — before they
          can take a job, so you know who&apos;s coming to your home. Typical rates run{" "}
          <strong className="text-foreground">
            {service.priceRange} {service.priceUnit}
          </strong>
          , and your payment stays safely in escrow until you approve the finished work.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={`${SPA_URL}/auth?mode=register`}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
          >
            Hire a {service.name}
          </a>
          <a
            href={`${SPA_URL}/auth?mode=register`}
            className="inline-flex items-center justify-center rounded-xl border-2 border-primary/20 bg-surface px-8 py-4 text-base font-bold text-primary transition-colors hover:border-primary/50"
          >
            Work as a {service.name}
          </a>
        </div>
      </section>

      {/* Common jobs */}
      <section className="border-t border-border bg-surface-2 py-14 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
            Common {service.name} Jobs
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {service.commonJobs.map((job) => (
              <span
                key={job}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                {job}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="mb-8 text-2xl font-extrabold tracking-tight sm:text-3xl">Typical Pricing</h2>
          <div className="rounded-3xl border border-border bg-surface p-8 shadow-sm sm:p-10">
            <p className="mb-2 text-4xl font-extrabold text-primary sm:text-5xl">
              {service.priceRange}
              <span className="ml-2 text-base font-semibold text-muted-foreground">
                {service.priceUnit}
              </span>
            </p>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Typical range — not a fixed price
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">{service.priceNote}</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-surface-2 py-14 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
            How It Works
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS(service).map((step, i) => (
              <div key={step.title} className="rounded-2xl border border-border bg-surface p-6 text-center">
                <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mb-1.5 text-sm font-bold">{step.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Worker CTA */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center sm:p-12">
            <ShieldCheck className="mx-auto mb-4 h-8 w-8 text-emerald-600" />
            <h2 className="mb-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Work in your own city, on your schedule
            </h2>
            <p className="mx-auto mb-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Whenever you want, no pressure — no need to travel to another city for work.
            </p>
            <p className="mx-auto mb-8 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {service.workerPitch}
            </p>
            <a
              href={`${SPA_URL}/auth?mode=register`}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 sm:text-base"
            >
              Work as a {service.name}
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-surface-2 py-14 sm:py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {service.faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-border bg-surface p-5 open:pb-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold">
                  {faq.question}
                  <span className="shrink-0 text-lg text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-14 text-center sm:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Ready to get started?
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={`${SPA_URL}/auth?mode=register`}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
            >
              Hire a {service.name}
            </a>
            <a
              href={`${SPA_URL}/auth?mode=register`}
              className="inline-flex items-center justify-center rounded-xl border-2 border-primary/20 bg-surface px-8 py-4 text-base font-bold text-primary transition-colors hover:border-primary/50"
            >
              Work as a {service.name}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

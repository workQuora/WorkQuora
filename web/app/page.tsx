import type { Metadata } from "next";
import Hero from "@/components/landing/Hero";
import StatsBar from "@/components/landing/StatsBar";
import PopularServices from "@/components/landing/PopularServices";
import HowItWorks from "@/components/landing/HowItWorks";
import AudienceSplit from "@/components/landing/AudienceSplit";
import TrustPriority from "@/components/landing/TrustPriority";
import Testimonials from "@/components/landing/Testimonials";
import CtaBanner from "@/components/landing/CtaBanner";
import { SITE_URL, SPA_URL } from "@/lib/constants";

export const metadata: Metadata = {
  // Root page.tsx shares its route segment with the root layout, so
  // layout's title.template doesn't apply here (per Next.js metadata
  // rules) — the brand name has to be included explicitly.
  title: "WorkQuora — Find Work. Get Hired. Build Together.",
  description:
    "WorkQuora is India's KYC-verified freelance and local services marketplace. Post a job or find work with escrow-protected payments, verified profiles, and real-time chat.",
  alternates: { canonical: SITE_URL },
};

// Organization schema already lives site-wide in app/layout.tsx — kept to a
// single WebSite entry here (with a sitelinks search box) to avoid duplicate
// Organization structured data on the homepage.
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "WorkQuora",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SPA_URL}/discover?keyword={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Hero />
      <StatsBar />
      <PopularServices />
      <HowItWorks />
      <AudienceSplit />
      <TrustPriority />
      <Testimonials />
      <CtaBanner />
    </>
  );
}

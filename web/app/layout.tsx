import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/constants";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "India's KYC-verified local services & freelance marketplace. Find trusted local service providers and freelancers, or hire talent for your next project — securely, with verified identities and escrow-protected payments.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | WorkQuora",
    default: "WorkQuora — India's KYC-Verified Local Services & Freelance Marketplace",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "WorkQuora",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "WorkQuora",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WorkQuora",
    description: DESCRIPTION,
  },
};

// TODO: swap in a real logo asset under /public once brand assets are migrated.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "WorkQuora",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: "India's KYC-verified local services & freelance marketplace",
  areaServed: "IN",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

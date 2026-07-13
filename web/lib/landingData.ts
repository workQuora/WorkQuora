// Landing page static copy. Dynamic values (real stats, real reviews,
// per-service worker counts) are fetched at runtime — see StatsBar.tsx,
// Testimonials.tsx, and PopularServices.tsx. Nothing here is a fabricated
// number; sections that need live data render "—" or an empty state until
// the backend provides it.

export const WORK_STEPS = [
  {
    n: 1,
    title: "Post your requirement",
    body: "Tell us what work you need done and your budget — takes under a minute.",
    icon: "post" as const,
  },
  {
    n: 2,
    title: "Browse verified workers",
    body: "See KYC-verified profiles, ratings and reviews from real completed jobs before you hire.",
    icon: "browse" as const,
  },
  {
    n: 3,
    title: "Pay securely via escrow",
    body: "Your payment is held securely and released only when you approve the finished work.",
    icon: "escrow" as const,
  },
];

export const CLIENT_POINTS = [
  "Post your requirement in seconds",
  "Access verified and reviewed professionals",
  "Chat in real time and share details",
  "Pay securely using digital escrow",
  "Approve work and release payment",
];

export const WORKER_POINTS = [
  "Complete your KYC verification once",
  "Browse jobs in your local area",
  "Apply or get invited to jobs",
  "Complete work and get rated",
  "Receive payments instantly",
];

export const TRUST_ITEMS = [
  { title: "KYC Verified", body: "Aadhaar & PAN verified profiles for every user.", icon: "kyc" as const },
  { title: "Secure Escrow", body: "Your payments are safe until work is approved.", icon: "escrow" as const },
  { title: "Real-time Chat", body: "Built-in chat for clear, transparent communication.", icon: "chat" as const },
  { title: "On-time Payments", body: "Milestone-based payments ensure fair transactions.", icon: "clock" as const },
  { title: "Low Platform Fees", body: "A flat 12% keeps more of the payout with the worker.", icon: "fees" as const },
];

export const CONTACT = {
  email: "support@workquora.com",
  phone: "+91 99817 89795",
  phoneHref: "tel:+919981789795",
  address: "WorkQuora HQ, Bhopal, Madhya Pradesh, India",
};

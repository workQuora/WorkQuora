import {
  Droplet,
  Zap,
  Snowflake,
  Sparkles,
  Hammer,
  PaintRoller,
  ChefHat,
  type LucideIcon,
} from "lucide-react";

export interface FAQ {
  question: string;
  answer: string;
}

export interface ServiceData {
  slug: string;
  name: string;
  /** Plural, used in headings like "Hire Verified Plumbers Near You" */
  namePlural: string;
  /** Placeholder for future Hindi UI — not rendered yet, kept so translation
   * only means filling in this field, not touching page structure. */
  hindiHint: string;
  icon: LucideIcon;
  shortDescription: string;
  commonJobs: string[];
  priceRange: string;
  priceUnit: string;
  priceNote: string;
  workerPitch: string;
  faqs: FAQ[];
}

export const SERVICES: ServiceData[] = [
  {
    slug: "plumber",
    name: "Plumber",
    namePlural: "Plumbers",
    hindiHint: "प्लंबर",
    icon: Droplet,
    shortDescription: "Verified plumbers for repairs, leaks, and fittings — booked in minutes.",
    commonJobs: [
      "Tap repair",
      "Pipe leak fixing",
      "Bathroom fitting",
      "Geyser installation",
      "Drainage cleaning",
      "Water tank cleaning",
    ],
    priceRange: "₹300–₹600",
    priceUnit: "per hour",
    priceNote:
      "Small jobs (tap repair, minor leaks) are often a flat visit charge; bigger jobs (fittings, installations) are quoted after the plumber inspects the work.",
    workerPitch:
      "Fix taps, pipes, and fittings for verified clients near you — no long jobs in other cities, no fixed shifts.",
    faqs: [
      {
        question: "How quickly can I get a plumber?",
        answer:
          "Most requests get matched with a nearby verified plumber the same day. For urgent leaks, mark your job as urgent when posting so plumbers see it first.",
      },
      {
        question: "Do plumbers bring their own tools and materials?",
        answer:
          "Plumbers bring their own tools. Materials like taps, pipes, or a new geyser are usually purchased separately and added to the final bill — the plumber will tell you the cost before buying anything.",
      },
      {
        question: "Is the plumbing work guaranteed?",
        answer:
          "You only release payment from escrow once you're satisfied the job is done. If something's wrong immediately after, message the plumber through the app before marking the job complete.",
      },
      {
        question: "How is payment handled?",
        answer:
          "You fund the agreed amount into WorkQuora's escrow when you hire. It's held safely and released to the plumber only after you confirm the work is done.",
      },
      {
        question: "What if the same problem happens again?",
        answer:
          "Message the plumber directly through your job chat — most sort out a follow-up visit. If there's a dispute, WorkQuora's support team can step in and review the case.",
      },
    ],
  },
  {
    slug: "electrician",
    name: "Electrician",
    namePlural: "Electricians",
    hindiHint: "इलेक्ट्रीशियन",
    icon: Zap,
    shortDescription: "Verified electricians for wiring, fittings, and electrical repairs.",
    commonJobs: [
      "Wiring repair",
      "Switch & socket installation",
      "Fan installation",
      "MCB / fuse issues",
      "Inverter setup",
      "Light fixture installation",
    ],
    priceRange: "₹250–₹500",
    priceUnit: "per hour",
    priceNote:
      "Simple fixes (switches, fans) are usually a flat visit charge; rewiring or inverter setups are quoted after inspection since they depend on the scope of work.",
    workerPitch:
      "Take on wiring and repair jobs from verified clients in your area, on your own schedule — no travel to other cities required.",
    faqs: [
      {
        question: "Is it safe to hire an electrician through an app?",
        answer:
          "Every electrician on WorkQuora completes 5-step KYC (mobile, Aadhaar, PAN, bank, selfie) before they can take jobs, so you know exactly who's coming to your home.",
      },
      {
        question: "Do you handle emergency electrical issues?",
        answer:
          "Yes — mark your job as urgent when posting and nearby electricians see it first. Response times depend on who's available near you at that moment.",
      },
      {
        question: "Are the electricians experienced with home wiring specifically?",
        answer:
          "Electrician profiles show their completed jobs and client ratings, so you can see their track record with similar work before you hire.",
      },
      {
        question: "What about bigger jobs like full rewiring?",
        answer:
          "Post the job with as much detail as you can — most electricians will message you to discuss scope and give a proper quote before starting.",
      },
      {
        question: "How is pricing decided for bigger jobs?",
        answer:
          "For anything beyond a simple fix, the electrician quotes a price based on materials and time, you both agree in chat, and that amount is what gets funded into escrow.",
      },
    ],
  },
  {
    slug: "ac-repair",
    name: "AC Repair",
    namePlural: "AC Repair Technicians",
    hindiHint: "एसी रिपेयर",
    icon: Snowflake,
    shortDescription: "Verified AC technicians for servicing, gas refill, installation, and repair.",
    commonJobs: [
      "Gas refilling",
      "General service & cleaning",
      "New AC installation",
      "AC uninstallation",
      "Cooling issue diagnosis",
      "Compressor repair",
    ],
    priceRange: "₹400–₹800",
    priceUnit: "per visit",
    priceNote:
      "Gas refilling and compressor work cost more than a standard service and are quoted separately based on your AC type (split or window) and the issue.",
    workerPitch:
      "Service and repair ACs for verified households near you — busiest in summer, flexible the rest of the year, always your own hours.",
    faqs: [
      {
        question: "Do you service all AC brands and types?",
        answer:
          "Most technicians on WorkQuora service both split and window ACs across common brands. Check a technician's profile for the specific brands they've worked with.",
      },
      {
        question: "How much does gas refilling typically cost?",
        answer:
          "It depends on your AC's tonnage and refrigerant type — the technician will inspect and quote before starting, so you know the cost before agreeing.",
      },
      {
        question: "Can I book AC service before summer starts?",
        answer:
          "Yes, and it's often faster to get booked in the off-season when technicians have more availability than during peak summer demand.",
      },
      {
        question: "What if the AC problem isn't fixed after the visit?",
        answer:
          "Don't release the escrow payment until you're satisfied the issue is resolved. If it's a recurring problem, message the technician for a follow-up.",
      },
      {
        question: "Do you offer annual maintenance contracts?",
        answer:
          "You can book the same technician again directly for repeat seasonal servicing — there's no separate AMC product on WorkQuora today, but nothing stops you rebooking someone you trust.",
      },
    ],
  },
  {
    slug: "maid",
    name: "Maid",
    namePlural: "Maids & House Help",
    hindiHint: "मेड / घरेलू सहायिका",
    icon: Sparkles,
    shortDescription: "Verified maids and house help for daily cleaning, cooking, and chores.",
    commonJobs: [
      "Daily house cleaning",
      "Dishwashing",
      "Laundry & ironing",
      "Deep cleaning",
      "Bathroom cleaning",
      "Cooking assistance",
    ],
    priceRange: "₹3,000–₹8,000",
    priceUnit: "per month",
    priceNote:
      "Rates depend on daily hours and number of tasks (cleaning only vs. cleaning + cooking). One-time deep cleaning is usually priced separately, around ₹150–₹300/hour.",
    workerPitch:
      "Find households near you that need daily help — choose your hours, your area, and how many homes you work with.",
    faqs: [
      {
        question: "Can I hire a maid for just a few hours, not full-time?",
        answer:
          "Yes — you can hire for daily part-time work, or post a one-time job for deep cleaning without any ongoing commitment.",
      },
      {
        question: "How are maids verified before they enter my home?",
        answer:
          "Every maid completes WorkQuora's 5-step KYC — mobile, Aadhaar, PAN, bank, and a selfie match — before their profile is marked verified and visible to clients.",
      },
      {
        question: "What if the maid doesn't show up one day?",
        answer:
          "Message them directly through the app first. If it becomes a recurring issue, you can end the arrangement and hire someone else — there's no lock-in.",
      },
      {
        question: "Can I try before committing to a longer arrangement?",
        answer:
          "Yes, many clients start with a short trial period before agreeing to a longer monthly arrangement.",
      },
      {
        question: "Is there a difference between daily and live-in help?",
        answer:
          "WorkQuora is set up for daily/part-time local help, not live-in placements. All arrangements are between you and the verified helper directly.",
      },
    ],
  },
  {
    slug: "carpenter",
    name: "Carpenter",
    namePlural: "Carpenters",
    hindiHint: "बढ़ई",
    icon: Hammer,
    shortDescription: "Verified carpenters for furniture repair, fittings, and custom woodwork.",
    commonJobs: [
      "Furniture repair",
      "Door & window fitting",
      "Custom furniture",
      "Modular kitchen work",
      "Lock repair",
      "Wood polishing",
    ],
    priceRange: "₹400–₹700",
    priceUnit: "per hour",
    priceNote:
      "Repairs are usually charged hourly; custom furniture and modular kitchen work are quoted as a fixed project price based on materials and design.",
    workerPitch:
      "Take on repair and custom furniture jobs from verified clients near you, at rates you agree to upfront.",
    faqs: [
      {
        question: "Can carpenters build custom furniture, or only repair?",
        answer:
          "Both — carpenter profiles show whether they take on custom builds like wardrobes or modular kitchens versus repair-only work, so you can filter for what you need.",
      },
      {
        question: "Do I need to buy the wood or material myself?",
        answer:
          "For small repairs, the carpenter usually handles materials. For bigger custom work, this is agreed upfront in chat — some clients prefer to buy materials themselves.",
      },
      {
        question: "How long does typical carpentry work take?",
        answer:
          "Simple repairs are often same-day. Custom furniture or modular kitchen work can take days to weeks depending on scope — the carpenter will give you a timeline before you hire.",
      },
      {
        question: "Can I get a cost estimate before work starts?",
        answer:
          "Yes — for anything beyond a quick repair, ask the carpenter for a quote in chat before funding escrow, so there are no surprises.",
      },
      {
        question: "Do carpenters handle modular kitchen installation?",
        answer:
          "Many do — check individual profiles for modular kitchen experience, as this is more specialized than general furniture repair.",
      },
    ],
  },
  {
    slug: "painter",
    name: "Painter",
    namePlural: "Painters",
    hindiHint: "पेंटर",
    icon: PaintRoller,
    shortDescription: "Verified painters for interior, exterior, and waterproofing work.",
    commonJobs: [
      "Interior wall painting",
      "Exterior painting",
      "Waterproofing",
      "Texture / POP work",
      "Wood & metal painting",
      "Wall putty",
    ],
    priceRange: "₹15–₹25",
    priceUnit: "per sq. ft (labor)",
    priceNote:
      "This covers labor only — paint and materials are usually billed separately at actual cost. Waterproofing and texture work are quoted separately from plain wall painting.",
    workerPitch:
      "Get painting jobs from verified clients near you — quote per job, work at your own pace, no fixed daily wage required.",
    faqs: [
      {
        question: "How is painting cost calculated?",
        answer:
          "Most painters quote per square foot for labor, based on the area to be painted. Get a quote from the painter after they see the space or your description.",
      },
      {
        question: "Do painters supply the paint, or do I buy it?",
        answer:
          "This varies by painter — some quote labor-only and let you buy paint, others include material cost. Confirm this in chat before agreeing on price.",
      },
      {
        question: "How long does a typical 2BHK take to paint?",
        answer:
          "A full 2BHK interior repaint usually takes 3–5 days depending on prep work needed (putty, primer) and drying time between coats.",
      },
      {
        question: "Do you handle waterproofing separately?",
        answer:
          "Yes — waterproofing is a distinct job from regular painting and is quoted separately since it uses different materials and techniques.",
      },
      {
        question: "Can I get a color consultation?",
        answer:
          "Many painters can advise on finishes and shades, but WorkQuora doesn't have a dedicated design-consultation product — discuss this directly with the painter before hiring.",
      },
    ],
  },
  {
    slug: "cook",
    name: "Cook",
    namePlural: "Cooks",
    hindiHint: "रसोइया / कुक",
    icon: ChefHat,
    shortDescription: "Verified cooks for daily home meals, tiffin service, and special occasions.",
    commonJobs: [
      "Daily home cooking",
      "Tiffin / meal prep",
      "Party & event cooking",
      "Diet-specific meals",
      "Festival special cooking",
      "Meal planning",
    ],
    priceRange: "₹4,000–₹10,000",
    priceUnit: "per month",
    priceNote:
      "Rates depend on meals per day and household size. One-time party or event cooking is priced separately, usually per guest or per dish.",
    workerPitch:
      "Cook for households near you on a schedule that works for you — daily, part-time, or just for events.",
    faqs: [
      {
        question: "Can I hire a cook for just one meal, or only monthly?",
        answer:
          "Both — post a one-time job for a party or event, or arrange ongoing daily/part-time cooking with a cook you like.",
      },
      {
        question: "Can cooks prepare specific diets like Jain, vegan, or diabetic meals?",
        answer:
          "Many cooks specialize in specific diets — mention your requirement when posting the job so cooks with relevant experience can respond.",
      },
      {
        question: "Is the cook KYC verified before entering my home?",
        answer:
          "Yes — every cook completes WorkQuora's 5-step verification (mobile, Aadhaar, PAN, bank, selfie) before their profile goes live.",
      },
      {
        question: "What about festival or party-specific cooking?",
        answer:
          "Post it as a one-time job with your guest count and menu preferences — cooks experienced with event cooking will bid on it.",
      },
      {
        question: "How is the cook's schedule decided?",
        answer:
          "You agree on timing directly with the cook before hiring — WorkQuora doesn't fix shifts, so it's whatever works for both of you.",
      },
    ],
  },
];

export function getServiceBySlug(slug: string): ServiceData | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

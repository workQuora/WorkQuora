import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, HelpCircle, Users, Target, Briefcase, Award, ArrowLeft, Mail, Phone, MapPin, 
  CheckCircle2, Compass, AlertCircle, Sparkles, Building, Rocket, Send, Star, FileText, BookOpen,
  Handshake, Newspaper, MessageSquare, DollarSign, TrendingUp, Check, ChevronRight
} from 'lucide-react';

const InfoPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Contact Form State (Used in contact-us template)
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setContactName('');
    setContactEmail('');
    setContactMsg('');
    setTimeout(() => setSubmitted(false), 5000);
  };

  // Content Templates Mapping
  const templates = {
    'about-us': {
      icon: Users,
      color: '#6366f1',
      title: 'About WorkQuora',
      subtitle: 'Building the future of localized freelance ecosystems in India.',
      content: (
        <div className="space-y-6">
          <p className="leading-relaxed">
            WorkQuora was founded in 2026 with a bold vision: to bridge the gap between clients needing instant services and independent professionals working locally. Traditional marketplace platforms focus entirely on remote, global assignments, leaving local and proximity-based talent underserved. 
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="p-5 rounded-2xl bg-card border border-border">
              <h4 className="font-extrabold text-foreground mb-2 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-primary" /> Our Mission
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Empower Indian service professionals and freelancers to find high-paying jobs in their immediate vicinity, enabling offline-to-online workspace transitions.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border">
              <h4 className="font-extrabold text-foreground mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" /> Our Technology
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Using real-time geolocation matching, secure escrow contracts, and direct real-time communication tools, we make hiring as seamless as booking a ride.
              </p>
            </div>
          </div>
          <p className="leading-relaxed">
            Whether you are a developer, designer, writer, plumber, or electrician, WorkQuora provides the infrastructure to build a sustainable, trusted local business.
          </p>
        </div>
      )
    },
    'how-to-hire': {
      icon: Briefcase,
      color: '#4f46e5',
      title: 'How to Hire on WorkQuora',
      subtitle: 'Find, assign, and collaborate with top local talent in 4 simple steps.',
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            {[
              { step: '1', title: 'Post a Job Post', desc: 'Describe your project requirements, duration, and budget. Our platform matches you automatically with nearby professionals.' },
              { step: '2', title: 'Review Proposals', desc: 'Browse bids submitted by interested freelancers. View their KYC status, ratings, location proximity, and portfolios.' },
              { step: '3', title: 'Fund Escrow', desc: 'Deposit funds into our secure escrow vault. Funds are only released once you review and approve the completed work.' },
              { step: '4', title: 'Approve & Release', desc: 'Collaborate via integrated real-time chats. Once work meets expectations, authorize release of payment.' }
            ].map((s) => (
              <div key={s.step} className="flex gap-4 p-4 rounded-2xl bg-card border border-border items-start">
                <span className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary font-black shrink-0">{s.step}</span>
                <div>
                  <h4 className="font-extrabold text-foreground text-sm">{s.title}</h4>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    'how-to-find-work': {
      icon: Compass,
      color: '#10b981',
      title: 'How to Find Work',
      subtitle: 'Start earning, build your reputation, and scale your client base.',
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            {[
              { step: '1', title: 'Complete Verification', desc: 'Submit your Aadhaar, PAN details, and link your bank account to earn the KYC verification trust badge.' },
              { step: '2', title: 'Set Location Radar', desc: 'Configure your active service radius (e.g. 15 km) to receive real-time notifications for nearby client job postings.' },
              { step: '3', title: 'Submit Custom Bids', desc: 'Submit proposals describing your matching skills, timelines, and requested milestones.' },
              { step: '4', title: 'Get Paid Securely', desc: 'Perform the task. Once the client approves, funds transfer directly to your wallet for instant bank withdrawals.' }
            ].map((s) => (
              <div key={s.step} className="flex gap-4 p-4 rounded-2xl bg-card border border-border items-start">
                <span className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 font-black shrink-0">{s.step}</span>
                <div>
                  <h4 className="font-extrabold text-foreground text-sm">{s.title}</h4>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    'trust-safety-security': {
      icon: ShieldCheck,
      color: '#ef4444',
      title: 'Trust & Safety Shield',
      subtitle: 'State-of-the-art protections for your payments, identity, and deliverables.',
      content: (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-red-500 animate-pulse" /> Verified Ecosystem Standards
            </h3>
            <ul className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Mandatory KYC Verification</strong>: No user can assign tasks or bid on assignments without verified Aadhaar & PAN accounts.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Secure Escrow Locks</strong>: Clients fund milestones upfront. Freelancers work confidently knowing payment is locked.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Withdrawal PIN Checks</strong>: A secure 4-digit PIN is requested for linked bank transfers to secure wallet balances.</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    'careers': {
      icon: Sparkles,
      color: '#8b5cf6',
      title: 'Careers at WorkQuora',
      subtitle: 'We are hiring! Help us build the ultimate local freelance platform.',
      content: (
        <div className="space-y-6">
          <p className="leading-relaxed">
            At WorkQuora, we are a fast-paced, product-obsessed team based in Bhopal, MP. We are backed by premium startup incubators and work on solving hard real-world location-based service challenges.
          </p>
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Open Positions</h4>
            {[
              { role: 'Senior React / React Native Engineer', dept: 'Engineering', loc: 'Bhopal / Hybrid' },
              { role: 'Backend Node.js Developer (Geo-indexing)', dept: 'Engineering', loc: 'Bhopal / Hybrid' },
              { role: 'UI/UX Product Designer', dept: 'Design', loc: 'Remote' },
            ].map((j, i) => (
              <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors">
                <div>
                  <p className="text-xs font-bold text-foreground">{j.role}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{j.dept} · {j.loc}</p>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary dark:text-primary border border-primary/20 px-2.5 py-1 rounded-full font-bold">Apply Now</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    'contact-us': {
      icon: Mail,
      color: '#ec4899',
      title: 'Contact Us',
      subtitle: 'Get in touch with the WorkQuora team. We are here to help.',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Support Channels</h4>
            {[
              { icon: Mail, label: 'Email Support', val: 'support@workquora.com' },
              { icon: Phone, label: 'Helpline', val: '+91 99817 89795' },
              { icon: MapPin, label: 'HQ Address', val: 'WorkQuora Labs, MP Nagar, Bhopal, India' },
            ].map((c, i) => (
              <div key={i} className="flex gap-3 items-center p-3 rounded-2xl bg-card border border-border">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
                  <c.icon className="w-4 h-4 text-pink-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{c.label}</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">{c.val}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Send a Message</h4>
            {submitted ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto animate-bounce" />
                <p className="text-xs font-bold text-foreground">Message Sent Successfully!</p>
                <p className="text-[10px] text-muted-foreground">We will respond within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3.5">
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-background text-foreground border border-border outline-none focus:border-pink-500/50"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-background text-foreground border border-border outline-none focus:border-pink-500/50"
                />
                <textarea
                  placeholder="Describe your issue or query..."
                  required
                  rows="3"
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-background text-foreground border border-border outline-none focus:border-pink-500/50"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      )
    },
    'our-vision': {
      icon: Target,
      color: '#3b82f6',
      title: 'Our Vision',
      subtitle: 'Decentralizing local opportunities across Indian tier-2 and tier-3 cities.',
      content: (
        <div className="space-y-6">
          <p className="leading-relaxed">
            By decentralizing professional marketplace opportunities, WorkQuora envisions a future where skilled talent does not need to migrate to tier-1 metropolitan cities (such as Bangalore or Mumbai) to build premium careers.
          </p>
          <p className="leading-relaxed">
            By building direct location-aware pipelines, we allow local economies to circulate wealth internally. Clients get faster turnarounds, and freelancers establish local, trusted, repeat partnerships.
          </p>
        </div>
      )
    },
    'business-solutions': {
      icon: Building,
      color: '#3b82f6',
      title: 'Enterprise Business Solutions',
      subtitle: 'Custom support and high-volume matching tools for scaling operations.',
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            For businesses requiring batch assignment, automated localized payroll, and contract verification support, WorkQuora offers premium Business Solutions:
          </p>
          <div className="p-4 rounded-xl border border-border bg-card/50 space-y-2">
            <h4 className="font-extrabold text-foreground text-xs uppercase">Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
              <li>Direct batch task allocation via API integrations</li>
              <li>Consolidated monthly local billing</li>
              <li>On-demand verification support</li>
            </ul>
          </div>
        </div>
      )
    },
    'enterprise': {
      icon: Building,
      color: '#4f46e5',
      title: 'WorkQuora Enterprise',
      subtitle: 'Custom local deployment pipelines and bulk staffing for large business networks.',
      content: (
        <div className="space-y-6">
          <p className="leading-relaxed">
            WorkQuora Enterprise delivers managed localized workforce solutions for corporate groups, regional agencies, and franchises. We supply API endpoints, custom geofenced recruitment portals, and automated tax compliance support for companies managing 50+ local contractors simultaneously.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            {[
              { title: 'Custom API Integrations', desc: 'Directly dispatch job requests from your internal dashboard into our local matching system.' },
              { title: 'Corporate Compliance', desc: 'Centralized Indian tax filing, automatic invoice generation, and custom contract options.' },
              { title: 'Dedicated Managers', desc: 'A dedicated team based in India to manually monitor client escrow, verify KYC, and arbitrate disputes.' }
            ].map((f, i) => (
              <div key={i} className="p-4 rounded-2xl bg-card border border-border">
                <h5 className="font-extrabold text-foreground text-xs mb-1.5">{f.title}</h5>
                <p className="text-muted-foreground text-[11px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="p-5 rounded-2xl border border-primary/10 bg-primary/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-primary dark:text-primary">Scale your business operations today</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Talk to our enterprise consultants for a custom integration demo.</p>
            </div>
            <Link to="/info/contact-us" className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-xl text-xs font-bold transition-all shrink-0">
              Request Demo
            </Link>
          </div>
        </div>
      )
    },
    'direct-contracts': {
      icon: FileText,
      color: '#10b981',
      title: 'Direct Contracts',
      subtitle: 'Invoice off-platform clients using WorkQuora secure escrow at 0% fees.',
      content: (
        <div className="space-y-6">
          <p className="leading-relaxed">
            Met an interesting client on social media or in-person? You can bring them to WorkQuora to execute contract terms. Protect yourself against non-payments using our secure digital escrow vault with <strong>zero platform fee</strong> charges.
          </p>
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">How Direct Contracts Protect You:</h4>
            {[
              { title: 'Secure Escrow Milestones', desc: 'Client funds the contract milestones upfront before you start working.' },
              { title: 'Zero Fees for Freelancers', desc: 'We charge exactly 0% commission on payments from your off-platform invited clients.' },
              { title: 'Dispute Arbitration Guard', desc: 'Access 24/7 contract review if disputes arise on milestone deliverability.' }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start p-3 bg-card border border-border rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-extrabold text-foreground text-xs">{item.title}</h5>
                  <p className="text-muted-foreground text-[10px] mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    'workquora-pro': {
      icon: Sparkles,
      color: '#f59e0b',
      title: 'WorkQuora Pro Membership',
      subtitle: 'Premium lead badges and reduced transaction fees for scaling specialists.',
      content: (
        <div className="space-y-6">
          <p className="leading-relaxed">
            Elevate your freelance business with <strong>WorkQuora Pro</strong>. Designed for established local contractors, Pro membership offers advanced features to double your client pipeline and lower payment collection costs.
          </p>
          <div className="border border-border rounded-2xl overflow-hidden bg-card">
            <div className="bg-amber-500/10 px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">WorkQuora Pro Plan</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">₹499 / Month (Billed Annually)</p>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Upgrade Option</span>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="flex gap-2"><Check className="w-4 h-4 text-amber-500 shrink-0" /><p className="text-muted-foreground"><strong>Pro Badge</strong> displayed on search results page.</p></div>
              <div className="flex gap-2"><Check className="w-4 h-4 text-amber-500 shrink-0" /><p className="text-muted-foreground"><strong>5-Minute Radar Alerts</strong>: Get instant SMS/push alerts for client job posts.</p></div>
              <div className="flex gap-2"><Check className="w-4 h-4 text-amber-500 shrink-0" /><p className="text-muted-foreground"><strong>Reduced Escrow Fees</strong>: Platform fee drops from 10% to 5%.</p></div>
              <div className="flex gap-2"><Check className="w-4 h-4 text-amber-500 shrink-0" /><p className="text-muted-foreground"><strong>Unlimited Active Bids</strong>: Bid on up to 50 jobs per month.</p></div>
            </div>
          </div>
        </div>
      )
    },
    'help-support': {
      icon: HelpCircle,
      color: '#3b82f6',
      title: 'Help & Support Desk',
      subtitle: 'Answers to frequently asked questions and direct service links.',
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Frequently Asked Questions</h4>
            {[
              { q: 'How long do bank withdrawals take?', a: 'Withdrawals are processed instantly via UPI or IMPS. In rare cases, banking system delays can take up to 24 hours.' },
              { q: 'What happens if a client doesn\'t release payment?', a: 'If a client is unresponsive, you can file a dispute after 72 hours of work submission. Our compliance team will audit the chat and milestone proof to make a decision.' },
              { q: 'How does the location radar work?', a: 'We read your browser GPS or custom city/pincode filter, matching you with opportunities within the radius (5km to 200km) set in your profile.' }
            ].map((faq, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                <h5 className="font-extrabold text-foreground text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" /> {faq.q}
                </h5>
                <p className="text-muted-foreground text-[11px] leading-relaxed pl-3">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="p-5 rounded-2xl border border-border bg-card/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-xs font-bold text-foreground">Still need assistance?</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Our India-based support desk is active 24/7 for account queries.</p>
            </div>
            <Link to="/info/contact-us" className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:opacity-90 transition-all cursor-pointer">
              Open Support Ticket
            </Link>
          </div>
        </div>
      )
    },
    'success-stories': {
      icon: Star,
      color: '#ec4899',
      title: 'Success Stories',
      subtitle: 'Read how local service providers in India are scaling their income on WorkQuora.',
      content: (
        <div className="space-y-6">
          <p className="leading-relaxed">
            WorkQuora has enabled offline professionals across Tier-2 and Tier-3 cities in India to find reliable, high-paying clients locally. Here is what some of our verified members say:
          </p>
          <div className="space-y-4">
            {[
              { name: 'Rajesh Kumar', role: 'Verified Electrician', city: 'Bhopal, MP', quote: 'WorkQuora completely changed my plumbing & electrical business. Earlier, I waited in the market for daily wage jobs. Now I get contract bookings directly on my phone from clients just 2 km away in MP Nagar.', rating: 5 },
              { name: 'Amit Sharma', role: 'Full-Stack Developer', city: 'Indore, MP', quote: 'I graduated in Indore and wanted to work locally instead of migrating to Bangalore. Through WorkQuora, I found three local startup clients who hired me for website updates. I work from home and get paid securely via escrow.', rating: 5 },
              { name: 'Priya Verma', role: 'Graphic Designer', city: 'Jabalpur, MP', quote: 'As a student designer, getting local client trust was hard. WorkQuora KYC badge gave clients confidence. I have completed 15+ brochures and branding projects within Jabalpur.', rating: 5 }
            ].map((story, i) => (
              <div key={i} className="p-5 rounded-2xl bg-card border border-border space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-extrabold text-foreground text-xs">{story.name}</h5>
                    <p className="text-[10px] text-muted-foreground">{story.role} · {story.city}</p>
                  </div>
                  <div className="flex text-amber-500">
                    {[...Array(story.rating)].map((_, idx) => <Star key={idx} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed italic">"{story.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    'workquora-reviews': {
      icon: Award,
      color: '#06b6d4',
      title: 'WorkQuora Platform Reviews',
      subtitle: 'Verified user satisfaction scores, stats, and independent marketplace ratings.',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center my-6">
            <div className="p-5 rounded-2xl bg-card border border-border">
              <h4 className="text-3xl font-black text-primary dark:text-primary">4.8 / 5</h4>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">App Store Rating</p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border">
              <h4 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">99.2%</h4>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Escrow Completion</p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border">
              <h4 className="text-3xl font-black text-pink-600 dark:text-pink-400">50K+</h4>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Verified Indian Users</p>
            </div>
          </div>
          <p className="leading-relaxed">
            Our platform collects automatic reviews after every completed milestone contract. This ensures complete transparency and helps maintain professional standards across the local marketplace.
          </p>
        </div>
      )
    },
    'resources-blog': {
      icon: BookOpen,
      color: '#8b5cf6',
      title: 'Resources Blog & Guides',
      subtitle: 'Expert tips on billing, marketing, and scaling your service business.',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: '5 Steps to Land Your First Local Client', desc: 'A step-by-step blueprint on optimize your service radius, pricing bids, and setting up KYC.', time: '4 min read' },
              { title: 'Taxation & GST Guide for Indian Freelancers', desc: 'Understanding standard tax thresholds, filing forms, and setting up professional billing files.', time: '7 min read' },
              { title: 'Setting Rates: Hourly vs Milestone Billing', desc: 'Analyze standard charges for plumbers, developers, designers, and write-ups across tier-2 cities.', time: '5 min read' },
              { title: 'Ensuring Personal Safety on Offline Job Visits', desc: 'Best practices for verifying client details, coordinating phone communication, and escrow checks.', time: '6 min read' }
            ].map((blog, i) => (
              <div key={i} className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between hover:border-primary/30 transition-all group cursor-pointer">
                <div>
                  <span className="text-[9px] bg-primary/10 text-primary dark:text-primary px-2 py-0.5 rounded font-extrabold">{blog.time}</span>
                  <h5 className="font-extrabold text-foreground text-xs mt-2 group-hover:text-primary dark:group-hover:text-primary transition-colors">{blog.title}</h5>
                  <p className="text-muted-foreground text-[11px] mt-1 leading-relaxed line-clamp-2">{blog.desc}</p>
                </div>
                <div className="flex items-center text-[10px] font-bold text-primary mt-4 group-hover:translate-x-1 transition-transform">
                  Read Article <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    'community-forum': {
      icon: MessageSquare,
      color: '#f43f5e',
      title: 'Community Forums & Meetups',
      subtitle: 'Join virtual boards, local developer channels, and monthly networking meetups.',
      content: (
        <div className="space-y-6">
          <p className="leading-relaxed">
            WorkQuora is more than a platform — it is a thriving professional community. Join regional telegram groups, share tips, ask legal questions, or find developers and electricians to collaborate on complex assignments.
          </p>
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Active Regional Channels</h4>
            {[
              { city: 'WorkQuora Bhopal Circle', members: '1.2K Members', desc: 'Local monthly meetups at MP Nagar coworking hubs.' },
              { city: 'WorkQuora Indore Devs', members: '2.4K Members', desc: 'Tech stack collaborations, design review boards, and startup talks.' },
              { city: 'WorkQuora Central India Support Forum', members: '5K Members', desc: 'General legal help, GST audits, and platform feedback.' }
            ].map((forum, i) => (
              <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-card border border-border">
                <div>
                  <h5 className="font-extrabold text-foreground text-xs">{forum.city}</h5>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{forum.desc}</p>
                </div>
                <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full font-bold shrink-0">{forum.members}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    'press-media': {
      icon: Newspaper,
      color: '#6b7280',
      title: 'Press & Media Center',
      subtitle: 'Latest press releases, corporate news, and brand media assets.',
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            {[
              { date: 'June 02, 2026', title: 'WorkQuora raises seed round to expand geo-freelance platform into 10 new cities', desc: 'Official announcement of seed funding round backed by prime Indian startup accelerators, targeting local market development.' },
              { date: 'May 15, 2026', title: 'WorkQuora launches automated KYC trust badges powered by post-office APIs', desc: 'Revolutionary update enabling verification for service professionals across remote and suburban cities in Central India.' }
            ].map((news, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card space-y-1">
                <span className="text-[9px] text-muted-foreground font-bold">{news.date}</span>
                <h5 className="font-extrabold text-foreground text-xs leading-tight">{news.title}</h5>
                <p className="text-muted-foreground text-[10px] leading-relaxed">{news.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    'partners': {
      icon: Handshake,
      color: '#3b82f6',
      title: 'Our Integration Partners',
      subtitle: 'Enabling verification, payment services, and geofenced mapping.',
      content: (
        <div className="space-y-6">
          <p className="leading-relaxed">
            WorkQuora integrates with leading technology partners across India to offer secure escrow collections, accurate geocoding reverse lookups, and fast KYC checks.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'Razorpay Escrow API', desc: 'Secure UPI, cards, and net-banking deposits with milestone security releases.' },
              { name: 'UIDAI Verification', desc: 'Government-grade API for instantaneous Aadhaar and PAN check badges.' },
              { name: 'Mapbox Routing Engine', desc: 'Real-time geography matches and distance calculation mapping.' },
              { name: 'BigDataCloud Reverse Geocoder', desc: 'Instant localized coordinates translating into readable city regions.' }
            ].map((partner, i) => (
              <div key={i} className="p-4 bg-card border border-border rounded-2xl">
                <h5 className="font-extrabold text-foreground text-xs flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-500" /> {partner.name}
                </h5>
                <p className="text-muted-foreground text-[10px] mt-1 leading-relaxed pl-5">{partner.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }
  };

  // Fallback Template for Undefined Slugs
  const defaultTemplate = {
    icon: HelpCircle,
    color: '#6366f1',
    title: slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Information Center',
    subtitle: 'Learn more about WorkQuora services, safety rules, and platform updates.',
    content: (
      <div className="space-y-6">
        <p className="leading-relaxed">
          Welcome to the WorkQuora documentation portal. We are updating this section with detailed documents and guides. 
        </p>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-start gap-3 text-xs leading-relaxed">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Info: Custom Page In Progress</span>
            <p className="mt-0.5 text-muted-foreground">Our content team is editing detailed terms and layout structures for this section. Check back soon for guides, FAQ panels, and help desk tools!</p>
          </div>
        </div>
      </div>
    )
  };

  const page = templates[slug] || defaultTemplate;
  const PageIcon = page.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8 min-h-[70vh]">
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-muted-foreground dark:hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      {/* Hero Header block */}
      <div className="p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden bg-white dark:bg-[#0c0c14]">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: `${page.color}15` }} />
        
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${page.color}15` }}>
          <PageIcon className="w-7 h-7" style={{ color: page.color }} />
        </div>
        
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 dark:text-foreground">{page.title}</h1>
          <p className="text-xs text-slate-500 dark:text-muted-foreground leading-relaxed font-medium">{page.subtitle}</p>
        </div>
      </div>

      {/* Main content body */}
      <div className="text-slate-700 dark:text-gray-300 text-xs leading-relaxed space-y-4 p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c0c14]">
        {page.content}
      </div>
    </div>
  );
};

export default InfoPage;

import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowUp } from 'lucide-react';

const footerLinks = [
  {
    title: 'For Clients',
    links: [
      { label: 'How to Hire', to: '/info/how-to-hire' },
      { label: 'Talent Marketplace', to: '/discover' },
      { label: 'Project Catalog', to: '/discover' },
      { label: 'Business Solutions', to: '/info/business-solutions' },
      { label: 'Enterprise', to: '/info/enterprise' },
      { label: 'Direct Contracts', to: '/info/direct-contracts' },
    ],
  },
  {
    title: 'For Talent',
    links: [
      { label: 'How to Find Work', to: '/info/how-to-find-work' },
      { label: 'Direct Contracts', to: '/info/direct-contracts' },
      { label: 'Find Jobs Worldwide', to: '/discover' },
      { label: 'WorkQuora Pro', to: '/info/workquora-pro' },
      { label: 'Earnings & Wallet', to: '/freelancer/earnings' },
      { label: 'Freelancer Radar', to: '/discover' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help & Support', to: '/info/help-support' },
      { label: 'Success Stories', to: '/info/success-stories' },
      { label: 'WorkQuora Reviews', to: '/info/workquora-reviews' },
      { label: 'Resources Blog', to: '/info/resources-blog' },
      { label: 'Community Forum', to: '/info/community-forum' },
      { label: 'Trust, Safety & Security', to: '/info/trust-safety-security' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/info/about-us' },
      { label: 'Our Vision', to: '/info/our-vision' },
      { label: 'Careers', to: '/info/careers' },
      { label: 'Press & Media', to: '/info/press-media' },
      { label: 'Contact Us', to: '/info/contact-us' },
      { label: 'Partners', to: '/info/partners' },
    ],
  },
];

const socialLinks = [
  {
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
    href: '#',
  },
  {
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
      </svg>
    ),
    href: '#',
  },
  {
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
    href: '#',
  },
  {
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 11.54a29 29 0 0 0 .46 5.12 2.78 2.78 0 0 0 1.95 1.96C5.12 19.08 12 19.08 12 19.08s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96 29 29 0 0 0 .46-5.12 29 29 0 0 0-.46-5.12z" />
        <polygon points="9.75 15.02 15.5 11.54 9.75 8.05 9.75 15.02" />
      </svg>
    ),
    href: '#',
  },
  {
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
    href: '#',
  },
];

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-slate-50 dark:bg-[#0a0a0f] border-t border-slate-200 dark:border-white/5 text-muted-foreground text-xs transition-colors duration-300">
      {/* Upper Footer: Main Links grid */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        {footerLinks.map((group) => (
          <div key={group.title} className="space-y-4">
            <h4 className="text-slate-800 dark:text-white font-extrabold text-[13px] uppercase tracking-wider">{group.title}</h4>
            <ul className="space-y-2.5">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-slate-600 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-white transition-colors duration-250 font-medium block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Middle Footer: Startup vision & Branding */}
      <div className="border-t border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-slate-900 dark:text-white font-black text-sm tracking-tight">WorkQuora</span>
              <p className="text-[10px] text-slate-500 dark:text-muted-foreground font-medium">India's Premium Freelancer Startup</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-muted-foreground">Follow us</span>
            <div className="flex gap-2">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-200/60 dark:bg-white/5 hover:bg-indigo-600 hover:text-white transition-all duration-200 text-slate-600 dark:text-muted-foreground"
                >
                  <social.icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Legal & Copyright */}
      <div className="border-t border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-medium text-slate-500 dark:text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>© 2026 WorkQuora Global Inc.</span>
            <Link to="/" className="hover:text-slate-800 dark:hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/" className="hover:text-slate-800 dark:hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-slate-800 dark:hover:text-white transition-colors">CA Notice at Collection</Link>
            <Link to="/" className="hover:text-slate-800 dark:hover:text-white transition-colors">Cookie Settings</Link>
            <Link to="/" className="hover:text-slate-800 dark:hover:text-white transition-colors">Accessibility</Link>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200/60 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-muted-foreground hover:text-slate-950 dark:hover:text-foreground transition-all cursor-pointer active:scale-95"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import Logo from './Logo';
import SocialLinks from './SocialLinks';

const Footer = () => {
  return (
    <footer className="w-full border-t border-border/60 bg-slate-50 dark:bg-[#05050a]/90 backdrop-blur-md pt-16 pb-8 relative z-20 mt-16 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6">

        {/* Top Section: Detailed Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 mb-12">

          {/* Column 1: Brand, description & social */}
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium max-w-xs">
              Building trust through professional excellence. India's most secure marketplace for home and business services.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full w-fit font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure Escrow System
            </div>
            <div className="mt-2">
              <SocialLinks />
            </div>
          </div>

          {/* Column 2: Company */}
          <div className="text-center md:text-left pt-8 md:pt-0 border-t border-border/40 md:border-t-0">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <a href="/info/about-us" className="hover:text-primary transition-colors font-medium">About WorkQuora</a>
              </li>
              <li>
                <a href="/info/trust-safety" className="hover:text-primary transition-colors font-medium">Trust &amp; Company</a>
              </li>
              <li>
                <a href="/shared/messages" className="hover:text-primary transition-colors font-medium">Contact Us</a>
              </li>
              <li>
                <a href="/client/post-job" className="hover:text-primary transition-colors font-medium">Explore Services</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="text-center md:text-left pt-8 md:pt-0 border-t border-border/40 md:border-t-0">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <a href="/client/post-job" className="hover:text-primary transition-colors font-medium">Post a Job Requirement</a>
              </li>
              <li>
                <a href="/freelancer/earnings" className="hover:text-primary transition-colors font-medium">Smart Payouts &amp; Wallet</a>
              </li>
              <li>
                <a href="/info/trust-safety" className="hover:text-primary transition-colors font-medium">Trust &amp; Safety Policy</a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="text-center md:text-left pt-8 md:pt-0 border-t border-border/40 md:border-t-0">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <a href="/info/terms" className="hover:text-primary transition-colors font-medium">Terms of Service</a>
              </li>
              <li>
                <a href="/info/privacy-policy" className="hover:text-primary transition-colors font-medium">Privacy Policy</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-border/40 my-8"></div>

        {/* Bottom Section: Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-muted-foreground/60 font-medium">
            © {new Date().getFullYear()} WorkQuora Technologies Pvt Ltd. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6 text-[10px] text-muted-foreground/60 font-medium">
            <span>English (US)</span>
            <span>INR (₹)</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

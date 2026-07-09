import React from 'react';
import { Mail, Phone, MapPin, ShieldCheck, Heart } from 'lucide-react';
import Logo from './Logo';
import SocialLinks from './SocialLinks';

const Footer = () => {
  return (
    <footer className="w-full border-t border-border/60 bg-[#05050a]/90 backdrop-blur-md pt-16 pb-8 relative z-20 mt-16 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Top Section: Detailed Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1: Brand & Description */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Logo />
            </div>
            <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">
              WorkQuora is India's premier KYC-verified peer-to-peer freelance and gig marketplace. Empowering secure project collaborations through smart escrow payments, real-time messaging, and verified digital identity systems.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full w-fit font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure Escrow System
            </div>
          </div>

          {/* Column 2: Freelance Services */}
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4">
              Explore Services
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <a href="/discover" className="hover:text-primary transition-colors font-medium">Browse Open Jobs</a>
              </li>
              <li>
                <a href="/discover" className="hover:text-primary transition-colors font-medium">Find Top Talent</a>
              </li>
              <li>
                <a href="/client/post-job" className="hover:text-primary transition-colors font-medium">Post a Job Requirement</a>
              </li>
              <li>
                <a href="/shared/wallet" className="hover:text-primary transition-colors font-medium">Smart Payouts & Wallet</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Company */}
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4">
              Trust & Company
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <a href="/info/about-us" className="hover:text-primary transition-colors font-medium">About WorkQuora</a>
              </li>
              <li>
                <a href="/info/trust-safety" className="hover:text-primary transition-colors font-medium">Trust & Safety Policy</a>
              </li>
              <li>
                <a href="/info/terms" className="hover:text-primary transition-colors font-medium">Terms of Service</a>
              </li>
              <li>
                <a href="/info/privacy-policy" className="hover:text-primary transition-colors font-medium">Privacy Policy</a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Support */}
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4">
              Contact Us
            </h4>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium hover:text-primary transition-colors">support@workquora.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#10B981] shrink-0" />
                <span className="font-medium">+91 99999 99999</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="font-medium">
                  WorkQuora HQ, Bhopal, Madhya Pradesh, India
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-border/40 my-8"></div>

        {/* Bottom Section: Social Tray & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-muted-foreground/60 font-medium order-2 sm:order-1">
            © {new Date().getFullYear()} WorkQuora Technologies Pvt Ltd. All Rights Reserved.
          </p>
          <div className="order-1 sm:order-2 flex items-center gap-4">
            <SocialLinks />
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

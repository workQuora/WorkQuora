import React from 'react';
import Logo from './Logo';
import SocialLinks from './SocialLinks';

const Footer = () => {
  return (
    <footer className="w-full border-t border-white/5 bg-[#050508]/40 backdrop-blur-md py-10 relative z-20 mt-16">
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left branding */}
        <div className="flex flex-col items-center md:items-start gap-1.5">
          <Logo />
          <p className="text-[10px] text-muted-foreground/60 font-semibold tracking-wider uppercase mt-1">
            Billion-Dollar Freelance Hub
          </p>
        </div>

        {/* Right social tray & credits */}
        <div className="flex flex-col items-center md:items-end gap-3">
          <SocialLinks />
          <p className="text-[10px] text-muted-foreground/50">
            © {new Date().getFullYear()} WorkQuora Technologies. Made with ❤️ for Freelancers.
          </p>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;

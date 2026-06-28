import React, { useEffect, useState } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import ThreeScene from '../components/ThreeScene';
import Aurora from '../components/Aurora';
import Meteor from '../components/Meteor';
import Cursor from '../components/Cursor';
import Hero from '../components/Hero';
import Timeline from '../components/Timeline';
import FeaturesComing from '../components/FeaturesComing';
import SystemStatus from '../components/SystemStatus';
import Newsletter from '../components/Newsletter';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import Logo from '../components/Logo';
import { useAppStore } from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';

const Maintenance = () => {
  const { isLoadingComplete, isMaintenanceMode, maintenanceData } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // If the platform is online, prevent accessing /maintenance directly and redirect home
    if (mounted && !isMaintenanceMode) {
      window.location.href = '/';
    }
  }, [mounted, isMaintenanceMode]);

  if (!mounted) return null;

  const version = maintenanceData?.version || 'v3.0';
  const rawDesc = maintenanceData?.description || "WorkQuora is currently receiving a cinematic database and infrastructure upgrade. Scaling freelance platform with AI and smart matching.";
  const cleanDesc = rawDesc.replace(/\*\*/g, '');

  return (
    <>
      {/* ── React 19 Head Tag Hoisting (SEO & Metadata) ── */}
      <title>System Upgrade | WorkQuora {version}</title>
      <meta name="description" content={cleanDesc} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#09090B" />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={`System Upgrade | WorkQuora ${version}`} />
      <meta property="og:description" content={cleanDesc} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://www.workquora.com" />
      
      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "WorkQuora Under Maintenance",
          "description": "WorkQuora platform upgrades and database migrations in progress.",
          "offers": {
            "@type": "Offer",
            "category": "Freelance Services"
          }
        })}
      </script>

      {/* Glow Custom Cursor */}
      <Cursor />

      {/* Loading Overlay (Cinematic 3s delay) */}
      <LoadingScreen />

      {/* Background Interactive 3D Canvas Scene */}
      <ThreeScene />

      {/* Spawners & Background Lighting Blobs */}
      <Aurora />
      <Meteor />

      {/* Primary Page Wrapper */}
      <AnimatePresence>
        {isLoadingComplete && (
          <motion.div
            className="relative min-h-screen z-10 w-full overflow-x-hidden selection:bg-primary/30 selection:text-white"
            initial={{ opacity: 0, filter: 'blur(15px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Nav Header */}
            <header className="absolute top-0 inset-x-0 h-20 flex items-center justify-between px-6 md:px-12 max-w-7xl mx-auto z-50">
              <Logo />
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Engineering Lock
                </span>
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
              </div>
            </header>

            {/* Core Sections Grid */}
            <main className="max-w-5xl mx-auto px-6 pt-10 pb-16 space-y-24 md:space-y-32">
              
              {/* Hero block */}
              <section className="relative min-h-[85vh] flex items-center justify-center">
                <Hero />
              </section>

              {/* Status checklist */}
              <section className="relative">
                <SystemStatus />
              </section>

              {/* Timeline milestone */}
              <section className="relative">
                <div className="text-center mb-10">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest block mb-1">Timeline Log</h3>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Upgrade Milestones</h2>
                </div>
                <Timeline />
              </section>

              {/* Feature Grid List */}
              <section className="relative">
                <FeaturesComing />
              </section>

              {/* Email newsletter box */}
              <section id="newsletter-section" className="relative scroll-mt-24">
                <Newsletter />
              </section>

              {/* Accordion FAQ list */}
              <section className="relative">
                <FAQ />
              </section>

            </main>

            {/* Brand Footer */}
            <Footer />

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Maintenance;

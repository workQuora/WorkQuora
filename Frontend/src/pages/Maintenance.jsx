import React, { useEffect, useState, Suspense, lazy } from 'react';
import LoadingScreen from '../components/LoadingScreen';
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
import { useIsMobile } from '../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';

// Heavy WebGL/3D — code-split so three.js + drei never load on mobile
const ThreeScene = lazy(() => import('../components/ThreeScene'));
const Aurora = lazy(() => import('../components/Aurora'));
const Meteor = lazy(() => import('../components/Meteor'));

// Pure-CSS animated backdrop for mobile — no WebGL, no canvas, no requestAnimationFrame
const mobileGradientStyles = `
  @keyframes mqDrift1 {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
    50% { transform: translate3d(6%, -8%, 0) scale(1.1); }
  }
  @keyframes mqDrift2 {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
    50% { transform: translate3d(-8%, 6%, 0) scale(1.08); }
  }
  .mq-blob-1 { animation: mqDrift1 20s ease-in-out infinite; }
  .mq-blob-2 { animation: mqDrift2 24s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .mq-blob-1, .mq-blob-2 { animation: none; }
  }
`;

const MobileGradientBackdrop = () => (
  <div className="absolute inset-0 z-0 bg-[#040408] overflow-hidden pointer-events-none">
    <style>{mobileGradientStyles}</style>
    <div className="absolute inset-0 bg-gradient-to-tr from-[#020205] via-transparent to-[#070512]" />
    <div className="mq-blob-1 absolute -top-[10%] -left-[10%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-700/10 blur-[100px]" />
    <div className="mq-blob-2 absolute -bottom-[15%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-tr from-cyan-500/15 to-primary/10 blur-[90px]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#030307_90%)]" />
  </div>
);

const Maintenance = () => {
  const { isLoadingComplete, isMaintenanceMode, maintenanceData } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

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

      {/* Background: heavy WebGL scene on desktop, lightweight CSS gradient on mobile */}
      {isMobile ? (
        <MobileGradientBackdrop />
      ) : (
        <Suspense fallback={null}>
          {/* Background Interactive 3D Canvas Scene */}
          <ThreeScene />

          {/* Spawners & Background Lighting Blobs */}
          <Aurora />
          <Meteor />
        </Suspense>
      )}

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

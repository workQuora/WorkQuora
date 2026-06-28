import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Shield, Disc, ArrowRight, HelpCircle } from 'lucide-react';
import Countdown from './Countdown';
import ProgressBar from './ProgressBar';
import { MagneticButton } from './Buttons';
import { useAppStore } from '../store/appStore';
import toast from 'react-hot-toast';

const HeadingText = ({ text }) => {
  const letters = Array.from(text);
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: 0.04 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.h1
      className="text-4xl md:text-6xl font-black tracking-tight leading-none text-center select-none"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {letters.map((char, index) => (
        <motion.span
          key={index}
          variants={child}
          className={
            char === ' '
              ? 'inline-block w-3'
              : 'inline-block bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/70'
          }
        >
          {char}
        </motion.span>
      ))}
    </motion.h1>
  );
};

const Hero = () => {
  const { isMuted, setIsMuted, maintenanceData } = useAppStore();
  const [audioCtx, setAudioCtx] = useState(null);
  const [oscillator, setOscillator] = useState(null);
  const [gainNode, setGainNode] = useState(null);

  // Defaults
  const version = maintenanceData?.version || 'v3.0';
  const progressPercent = maintenanceData?.progressPercent || 78;
  const targetDate = maintenanceData?.targetLaunchDate || "June 29, 2026 12:00:00";
  const heading1 = maintenanceData?.headingLine1 || "WE ARE BUILDING";
  const heading2 = maintenanceData?.headingLine2 || "Something Amazing";
  const desc = maintenanceData?.description || "Our platform is currently receiving a major upgrade under **Engineering Bible Vol 11**.";
  const announcement = maintenanceData?.announcement || "WorkQuora v3.0 Core Upgrades Deploying";
  const socials = maintenanceData?.socials || {};

  // Initialize Web Audio API synthesizer for premium ambient background drone
  const initAudio = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0, ctx.currentTime); // start silent

      // Deep space atmospheric resonant filter bank
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, ctx.currentTime); // deep low A

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110, ctx.currentTime); // harmonic drone

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, ctx.currentTime);
      filter.Q.setValueAtTime(8, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      setAudioCtx(ctx);
      setGainNode(gain);
      setOscillator({ osc1, osc2 });
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  };

  const handleSoundToggle = async () => {
    if (!audioCtx) {
      initAudio();
      setIsMuted(false);
      return;
    }

    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    if (isMuted) {
      // Fade in drone to prevent click pop
      gainNode.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 1);
      setIsMuted(false);
      toast('Ambient Space Drone Active 🌌', { icon: '🔊' });
    } else {
      // Fade out
      gainNode.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.5);
      setIsMuted(true);
    }
  };

  // Clean up Web Audio node on unmount
  useEffect(() => {
    return () => {
      if (audioCtx) {
        audioCtx.close();
      }
    };
  }, [audioCtx]);

  return (
    <div className="relative w-full flex flex-col items-center justify-center min-h-screen text-center px-6 pt-24 pb-12 z-10 select-none">
      
      {/* Floating Badges Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap justify-center">
        <motion.div 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/5 bg-card/25 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-widest shadow-md"
          whileHover={{ y: -2 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>Server Status:</span>
          <span className="text-cyan-400">Online</span>
        </motion.div>

        <motion.div 
          className="px-3 py-1.5 rounded-full border border-white/5 bg-card/25 backdrop-blur-md text-[9px] font-bold text-primary uppercase tracking-widest shadow-md"
          whileHover={{ y: -2 }}
        >
          {version} Engine
        </motion.div>

        {/* Ambient Sound Toggle Button */}
        <motion.button
          onClick={handleSoundToggle}
          className="p-1.5 rounded-full border border-white/5 bg-card/25 hover:bg-white/5 text-muted-foreground hover:text-white transition-colors cursor-pointer shadow-md"
          whileHover={{ scale: 1.05 }}
          title={isMuted ? 'Unmute Ambient Sound' : 'Mute Ambient Sound'}
        >
          {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} className="text-primary animate-pulse" />}
        </motion.button>
      </div>

      {/* Floating Announcer banner */}
      <motion.div
        className="mb-8 p-3 rounded-2xl bg-gradient-to-r from-primary/10 to-cyan-400/5 border border-primary/20 backdrop-blur-md flex items-center gap-2 max-w-sm cursor-pointer hover:border-primary/40 transition-colors shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="w-5 h-5 bg-primary/20 text-primary rounded-lg flex items-center justify-center shrink-0">
          <span className="text-[10px] font-black">✨</span>
        </div>
        <span className="text-[10px] font-bold text-white uppercase tracking-wider text-left">
          {announcement}
        </span>
        <ArrowRight size={10} className="text-muted-foreground/60 group-hover:translate-x-1 transition-transform" />
      </motion.div>

      {/* Hero Typography */}
      <div className="max-w-3xl w-full mb-4">
        <HeadingText text={heading1} />
        
        {/* Cinematic gradient animated typography */}
        <motion.h2 
          className="text-5xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-400 to-cyan-400 uppercase select-none leading-[0.85] py-2"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            textShadow: '0 0 40px rgba(99, 102, 241, 0.1)',
          }}
        >
          {heading2}
        </motion.h2>
      </div>

      {/* Maintenance details */}
      <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-lg mb-8 leading-relaxed">
        {desc.replace(/\*\*/g, '')}
      </p>

      {/* Countdown Module */}
      <Countdown targetDate={targetDate} />

      {/* Progress Bar Module */}
      <ProgressBar targetPercent={progressPercent} />

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 relative z-20">
        <MagneticButton 
          className="bg-primary text-primary-foreground border-primary hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
          onClick={() => {
            const el = document.getElementById('newsletter-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Notify Me
        </MagneticButton>
        
        {socials.telegram && (
          <MagneticButton 
            className="bg-[#24A1DE] hover:bg-[#1E83B0] text-white border-transparent"
            onClick={() => window.open(socials.telegram, '_blank')}
          >
            <Disc size={12} className="animate-spin" /> Join Telegram
          </MagneticButton>
        )}

        {socials.whatsapp && (
          <MagneticButton 
            className="bg-[#25D366] hover:bg-[#1DA851] text-white border-transparent"
            onClick={() => window.open(socials.whatsapp, '_blank')}
          >
            WhatsApp Channel
          </MagneticButton>
        )}
        
        <MagneticButton 
          className="bg-transparent text-foreground border-white/5 hover:border-white/20"
          onClick={() => window.open(`mailto:support@workquora.local`)}
        >
          <HelpCircle size={12} /> Contact Support
        </MagneticButton>
      </div>

    </div>
  );
};

export default Hero;

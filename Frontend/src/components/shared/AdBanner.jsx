import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, X } from 'lucide-react';
import api from '../../services/api';

const AdCard = ({ ad, className = '' }) => {
  const [closed, setClosed] = useState(false);
  
  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const watchTimeRef = useRef(0);
  const isVisibleRef = useRef(false);
  const impressionTracked = useRef(false);

  const trackEvent = async (event, watchTimeSeconds = 0) => {
    try {
      await api.post('/ads/track', {
        adId: ad._id,
        event,
        watchTimeSeconds
      });
    } catch (err) {
      console.error(`Failed to track ad ${event}:`, err);
    }
  };

  useEffect(() => {
    if (closed || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisibleRef.current = entry.isIntersecting;

        if (entry.isIntersecting) {
          // Track Impression (only once per component mount)
          if (!impressionTracked.current) {
            impressionTracked.current = true;
            trackEvent('impression');
          }

          // Start Watch Time counter
          timerRef.current = setInterval(() => {
            watchTimeRef.current += 1;
          }, 1000);
        } else {
          // Pause Watch Time counter
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      { threshold: 0.5 } // 50% of the ad must be visible
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Flush remaining watch time when unmounted or hidden
      if (watchTimeRef.current > 0) {
        trackEvent('watch', watchTimeRef.current);
        watchTimeRef.current = 0; // Reset after sending
      }
    };
  }, [closed]);

  const handleAdClick = () => {
    trackEvent('click');
    window.open(ad.targetLink, '_blank', 'noopener,noreferrer');
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setClosed(true);
    // Flush watch time immediately on close
    if (watchTimeRef.current > 0) {
      trackEvent('watch', watchTimeRef.current);
      watchTimeRef.current = 0;
    }
  };

  if (closed) return null;

  return (
    <div 
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden border border-white/10 group cursor-pointer ${className}`}
      onClick={handleAdClick}
    >
      <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold tracking-wider text-white uppercase border border-white/10">
        Ad
      </div>
      
      <button 
        onClick={handleClose}
        className="absolute top-2 right-2 z-10 p-1 bg-black/60 backdrop-blur-md rounded-full text-white/70 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>

      {ad.mediaType === 'VIDEO' ? (
        <video 
          src={ad.mediaUrl} 
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-cover aspect-video"
        />
      ) : (
        <img 
          src={ad.mediaUrl} 
          alt={ad.title} 
          className="w-full h-full object-cover aspect-video"
        />
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-indigo-400 mb-0.5">{ad.brandName}</p>
            <h3 className="text-sm font-bold text-white line-clamp-1">{ad.title}</h3>
            {ad.description && <p className="text-xs text-gray-300 mt-1 line-clamp-2">{ad.description}</p>}
          </div>
          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white backdrop-blur-md group-hover:bg-indigo-500 transition-colors">
            <ExternalLink size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

const AdBanner = ({ platform = 'WEB', className = '' }) => {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    fetchActiveAds();
  }, [platform]);

  const fetchActiveAds = async () => {
    try {
      const res = await api.get(`/ads/active?platform=${platform}`);
      const fetchedAds = res.data?.data;
      
      if (Array.isArray(fetchedAds) && fetchedAds.length > 0) {
        // Filter by daily frequency constraint locally
        const today = new Date().toISOString().split('T')[0];
        
        const validAds = fetchedAds.filter(ad => {
          const storageKey = `ad_${ad._id}_${today}`;
          const viewsToday = parseInt(localStorage.getItem(storageKey) || '0', 10);
          
          if (viewsToday < ad.dailyFrequency) {
            // Pre-increment the local storage counter so we don't spam if component re-renders
            localStorage.setItem(storageKey, (viewsToday + 1).toString());
            return true;
          }
          return false;
        });

        setAds(validAds);
      }
    } catch (err) {
      console.error('Failed to fetch ads:', err);
    }
  };

  if (ads.length === 0) return null;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {ads.map(ad => (
        <AdCard key={ad._id} ad={ad} />
      ))}
    </div>
  );
};

export default AdBanner;

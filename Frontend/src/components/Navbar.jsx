import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  MapPin, Sun, Moon, MessageSquare,
  ChevronDown, Crosshair, Search, Loader2, PlusCircle, Wallet, Home,
  Menu, X
} from 'lucide-react';
import ProfileDropdown from './ui/ProfileDropdown';
import Logo from './Logo';
import Notifications from './Notifications';
import { updateLocalClientLocation } from '../actions/clientSlice';
import { fetchNearbyJobs } from '../actions/freelancerSlice';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const { user, onboarding } = useSelector((state) => state.auth);
  const freelancerRadius = useSelector((state) => state.freelancer?.radar?.radiusKm) || 15;

  const { theme, toggleTheme } = useTheme();
  
  // Location States
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [activeCity, setActiveCity] = useState('Bhopal, MP');
  const [locLoading, setLocLoading] = useState(false);
  const [locationInput, setLocationInput] = useState('');

  // Mobile drawer states
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch unread messages count
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages/conversations').then((r) => r.data?.conversations ?? r.data ?? []),
    enabled: !!user && onboarding?.onboardingComplete === true,
    refetchInterval: 15000,
  });

  const unreadMessagesCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Click outside handlers
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsLocationMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && !e.target.closest('.hamburger-btn')) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync activeCity and redux store location with user profile location on load
  useEffect(() => {
    if (user?.location?.city) {
      setActiveCity(user.location.city);
      const coords = user.location.coordinates || [77.4126, 23.2599];
      dispatch(updateLocalClientLocation({ lat: coords[1], lng: coords[0], city: user.location.city }));
    }
  }, [user]);

  const normalizeLocationLabel = (city, state) => {
    if (!city) return 'Bhopal, MP';
    let cleanCity = city.trim();
    // Strip redundant state if it is already in the city name
    if (cleanCity.toLowerCase().endsWith(', mp') || cleanCity.toLowerCase().endsWith(', madhya pradesh')) {
      cleanCity = cleanCity.replace(/,.*$/i, '');
    }
    let cleanState = state ? state.trim() : 'MP';
    if (cleanState === 'Madhya Pradesh') cleanState = 'MP';
    if (cleanState === 'Uttar Pradesh') cleanState = 'UP';
    if (cleanState === 'National Capital Territory of Delhi' || cleanState === 'Delhi') {
      cleanState = 'DL';
    }
    return `${cleanCity}, ${cleanState}`;
  };

  const dispatchLocationUpdate = async (lat, lng, cityName) => {
    setActiveCity(cityName);
    dispatch(updateLocalClientLocation({ lat, lng, city: cityName }));
    if (user) {
      try {
        await api.put('/profile/update', {
          city: cityName,
          address: cityName,
          coordinates: [lng, lat]
        });
      } catch (err) {
        console.error('Failed to persist location update in database:', err);
      }
    }
    if (user?.role?.toLowerCase() === 'freelancer') {
      dispatch(fetchNearbyJobs({ lat, lng, radiusKm: freelancerRadius }));
    }
    setIsLocationMenuOpen(false);
  };

  const handleAutoLocationFetch = () => {
    if (!('geolocation' in navigator)) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          let cityName = data.city || data.locality || 'Bhopal';
          let stateName = data.principalSubdivision || 'MP';
          if (data.principalSubdivisionCode && data.principalSubdivisionCode.startsWith("IN-")) {
            stateName = data.principalSubdivisionCode.split("-")[1];
          }
          const formattedCity = normalizeLocationLabel(cityName, stateName);
          await dispatchLocationUpdate(latitude, longitude, formattedCity);
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          await dispatchLocationUpdate(latitude, longitude, 'Bhopal, MP');
        } finally {
          setLocLoading(false);
        }
      },
      (error) => {
        console.error("GPS location error:", error);
        setLocLoading(false);
        dispatchLocationUpdate(23.2599, 77.4126, 'Bhopal, MP');
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
    );
  };

  const handleLocationSearch = async (e) => {
    e.preventDefault();
    const value = locationInput.trim();
    if (!value) return;

    // If it's exactly 6 digits, treat as pincode
    if (/^\d{6}$/.test(value)) {
      setLocLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await res.json();
        if (data[0]?.Status === 'Success') {
          const po = data[0].PostOffice[0];
          const formattedCity = normalizeLocationLabel(po.District || po.Block || 'Bhopal', po.State || 'MP');
          await dispatchLocationUpdate(23.2599, 77.4126, formattedCity);
          setLocationInput('');
        }
      } catch (err) { console.error(err); }
      finally { setLocLoading(false); }
    } else {
      // Treat as city/region
      let cityName = value;
      if (!cityName.includes(',')) cityName = `${cityName}, MP`;
      dispatchLocationUpdate(23.2599, 77.4126, cityName);
      setLocationInput('');
    }
  };

  const isDashboard = location.pathname === '/client/dashboard' || location.pathname === '/freelancer/dashboard';

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 dark:bg-[#07070c]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
        
        {/* LEFT BLOCK: Logo & Navigation Mega-Menus */}
        <div className="flex items-center gap-6">
          <div className="flex items-center cursor-pointer select-none" onClick={() => navigate('/')}>
            <Logo />
          </div>

          {/* Desktop original navigation links styled premium */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-white/[0.02] p-1 border border-slate-200/80 dark:border-white/5 rounded-xl">
            {user && (
              <NavLink 
                to="/" 
                className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive ? 'bg-white dark:bg-white/5 text-primary dark:text-white shadow-sm border border-slate-200 dark:border-white/10' : 'text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <Home size={14} /><span>Home</span>
              </NavLink>
            )}
            {user && (
              <NavLink
                to="/shared/messages"
                className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                  isActive ? 'bg-white dark:bg-white/5 text-primary dark:text-white shadow-sm border border-slate-200 dark:border-white/10' : 'text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <MessageSquare size={14} />
                <span>Messages</span>
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm border border-white dark:border-[#0f0f18]">
                    {unreadMessagesCount}
                  </span>
                )}
              </NavLink>
            )}
            {user?.role?.toLowerCase() === 'client' && (
              <NavLink
                to="/client/post-job"
                className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive ? 'bg-white dark:bg-white/5 text-primary dark:text-white shadow-sm border border-slate-200 dark:border-white/10' : 'text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <PlusCircle size={14} className="text-primary dark:text-primary" /><span>Post Job</span>
              </NavLink>
            )}
            {user?.role?.toLowerCase() === 'freelancer' && (
              <NavLink
                to="/freelancer/earnings"
                className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive ? 'bg-white dark:bg-white/5 text-primary dark:text-white shadow-sm border border-slate-200 dark:border-white/10' : 'text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <Wallet size={14} className="text-emerald-600 dark:text-emerald-400" /><span>Earnings</span>
              </NavLink>
            )}
          </div>
        </div>

        {/* CENTER / RIGHT SECTION: User Status (Hidden on Mobile, Visible on Desktop) */}
        <div className="hidden lg:flex items-center gap-4">

          {/* Location radar button */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/5 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <strong className="text-slate-800 dark:text-foreground font-semibold max-w-[90px] truncate">{activeCity}</strong>
              <ChevronDown size={12} className={`text-slate-500 dark:text-muted-foreground transition-transform duration-250 ${isLocationMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLocationMenuOpen && (
              <div className="absolute right-0 mt-2.5 w-72 bg-white dark:bg-[#0f0f18] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">

                <div className="px-3 pt-2 pb-1.5">
                  <span className="text-sm font-medium text-slate-500 dark:text-muted-foreground">Location</span>
                </div>

                <button
                  onClick={handleAutoLocationFetch}
                  disabled={locLoading}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-indigo-50 dark:bg-primary/10 hover:bg-indigo-100 dark:hover:bg-primary/15 transition-colors mb-2 group disabled:opacity-60"
                >
                  {locLoading
                    ? <Loader2 size={17} className="animate-spin text-primary" />
                    : <Crosshair size={17} className="text-primary group-hover:rotate-90 transition-transform duration-300" />}
                  <span className="text-sm font-medium text-primary">Use current location</span>
                </button>

                <div className="flex items-center gap-2 px-3 py-1 mb-1">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
                  <span className="text-xs text-slate-400 dark:text-muted-foreground/60">or</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
                </div>

                <form onSubmit={handleLocationSearch} className="p-1">
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 focus-within:border-primary/40 focus-within:bg-white dark:focus-within:bg-white/[0.05] transition-colors">
                    <Search size={15} className="text-slate-400 dark:text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Search city or pincode"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground/50"
                    />
                    {locationInput.trim() && (
                      <button type="submit" className="text-xs font-semibold text-primary hover:underline shrink-0">
                        Go
                      </button>
                    )}
                  </div>
                </form>

              </div>
            )}
          </div>



          {/* Notifications component */}
          {user && <Notifications />}

          {/* Theme switcher */}
          <button onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-all cursor-pointer">
            {theme === 'dark' ? <Sun size={15} className="text-yellow-400" /> : <Moon size={15} className="text-primary dark:text-primary" />}
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>

          {/* Auth details / Login link */}
          {user ? (
            <ProfileDropdown />
          ) : (
            <NavLink
              to="/auth"
              className="px-5 py-2 rounded-full font-bold text-xs text-white bg-primary hover:bg-primary/80 transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              Sign Up
            </NavLink>
          )}
        </div>

        {/* MOBILE BLOCK: Hamburger & Profile (Visible on Mobile/Tablet, Hidden on Desktop) */}
        <div className="flex lg:hidden items-center gap-3">
          <button onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-muted-foreground dark:hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
            {theme === 'dark' ? <Sun size={15} className="text-yellow-400" /> : <Moon size={15} className="text-primary dark:text-primary" />}
          </button>
          
          {user && <Notifications />}
          
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="hamburger-btn p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-muted-foreground dark:hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

      </div>

      {/* MOBILE DRAWER PANEL */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" ref={mobileMenuRef}>
          {/* Overlay background */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          
          <aside className="fixed right-0 top-0 h-full w-72 bg-white dark:bg-[#0f0f18] border-l border-slate-200 dark:border-white/5 z-50 p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-6 overflow-y-auto max-h-[80vh]">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4">
                <Logo />
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-slate-800 dark:text-muted-foreground dark:hover:text-foreground"><X size={18} /></button>
              </div>

              {/* Mobile navigation links */}
              <div className="space-y-2.5 text-sm font-bold text-slate-600 dark:text-muted-foreground animate-in fade-in duration-300">
                {user && !isDashboard && (
                  <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground transition-colors">
                    <Home className="w-4 h-4" /> Home
                  </Link>
                )}
                {user && (
                  <Link to="/shared/messages" onClick={() => setMobileOpen(false)} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground transition-colors">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4" /> Messages
                    </div>
                    {unreadMessagesCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </Link>
                )}
                {user?.role?.toLowerCase() === 'client' && (
                  <Link to="/client/post-job" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground transition-colors">
                    <PlusCircle className="w-4 h-4 text-primary dark:text-primary" /> Post a Job
                  </Link>
                )}
                {user?.role?.toLowerCase() === 'freelancer' && (
                  <Link to="/freelancer/earnings" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground transition-colors">
                    <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> My Earnings
                  </Link>
                )}
              </div>

              {/* Set radar section on mobile */}
              <div className="border-t border-slate-200 dark:border-white/5 pt-4 space-y-2.5">
                <p className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest">Radar location: {activeCity}</p>
                <button onClick={() => { handleAutoLocationFetch(); setMobileOpen(false); }}
                  className="w-full flex items-center justify-between gap-2.5 px-3 py-2 bg-indigo-50 dark:bg-primary/5 hover:bg-indigo-100 dark:hover:bg-primary/10 text-primary dark:text-primary border border-indigo-100 dark:border-primary/20 rounded-xl text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-3.5 h-3.5" /> <span>Use GPS Location</span>
                  </div>
                  <span className="text-[8px] bg-indigo-100 dark:bg-primary/10 px-1.5 py-0.5 rounded text-primary dark:text-primary font-extrabold">GPS</span>
                </button>
              </div>
            </div>

            {/* Bottom auth drawer */}
            <div className="border-t border-slate-200 dark:border-white/5 pt-4">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary font-bold text-white text-xs overflow-hidden">
                      {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-foreground truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-muted-foreground capitalize">{user.role?.toLowerCase()}</p>
                    </div>
                  </div>
                  <ProfileDropdown />
                </div>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-2.5 block text-center rounded-xl bg-primary hover:bg-primary/80 text-white font-bold text-xs"
                >
                  Log In / Sign Up
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
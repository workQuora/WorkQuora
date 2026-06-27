import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Wallet, Settings, LogOut, 
  ChevronDown, User, Sparkles, ShieldCheck, ShieldX, ChevronRight
} from 'lucide-react';
import { logout } from '../../actions/authSlice';

const ProfileDropdown = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const menuRef = useRef(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  // Smooth outside bound handler for automated window closure
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleNavigation = (targetPath) => {
    navigate(targetPath);
    setIsOpen(false);
  };

  const handleLogoutAction = () => {
    dispatch(logout());
    navigate('/auth');
    setIsOpen(false);
  };

  // Safe normalized role string check (standardizing CLIENT/FREELANCER role text)
  const roleNormalized = user?.role?.toLowerCase() || 'freelancer';
  const isClient = roleNormalized === 'client';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      
      {/* TRIGGER AVATAR BUTTON: Glassmorphic Floating Style */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 p-1.5 pl-2 rounded-xl border transition-all duration-300 select-none active:scale-95 group focus:outline-none ${
          isOpen 
            ? 'bg-accent/85 border-primary/40 shadow-md ring-2 ring-primary/10' 
            : 'bg-accent/20 hover:bg-accent/50 border-border/60'
        }`}
      >
        <div className="relative">
          <img 
            src={user?.profilePic || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || user?.name || 'user'}`} 
            alt="User Session Trigger" 
            className="w-7 h-7 rounded-lg bg-primary/10 object-cover ring-1 ring-border group-hover:scale-105 transition-transform duration-200"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-background"></span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="hidden sm:block text-xs font-semibold text-foreground/90 tracking-wide group-hover:text-foreground transition-colors max-w-[100px] truncate">
            {user?.name || 'User'}
          </span>
          {user?.kycVerified ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10 shrink-0 hidden sm:block" />
          ) : (
            <ShieldX className="w-3.5 h-3.5 text-rose-500 shrink-0 hidden sm:block" />
          )}
        </div>
        
        <ChevronDown 
          size={14} 
          className={`text-muted-foreground/80 group-hover:text-foreground transition-transform duration-300 ease-out mr-1 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`} 
        />
      </button>

      {/* FLOATING DROPDOWN MENU CARD */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-68 bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] p-2 z-50 origin-top-right transform transition-all animate-in fade-in zoom-in-95 duration-200 ease-out">
          
          {/* SECTION 1: Identity Profile Card with large avatar */}
          <div className="px-3.5 py-3 bg-gradient-to-br from-accent/40 to-accent/10 border border-border/40 rounded-xl mb-2 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all duration-300"></div>
            
            <div className="flex items-center gap-3">
              <img 
                src={user?.profilePic || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || user?.name || 'user'}`} 
                alt="Profile Avatar" 
                className="w-10 h-10 rounded-xl bg-primary/10 object-cover ring-2 ring-border/50"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-foreground truncate tracking-tight">
                  {user?.name || 'User'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground truncate tracking-wider">
                    @{user?.username || user?.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'user'}
                  </p>
                  {user?.kycVerified ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10 shrink-0" />
                  ) : (
                    <ShieldX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40">
              <span className={`inline-flex items-center text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                isClient 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {isClient ? 'Client' : 'Freelancer'}
              </span>
              {/* Dynamic KYC verification badge */}
              <button
                onClick={() => handleNavigation('/shared/settings')}
                title={user?.kycVerified ? 'KYC Verified — Aadhaar & PAN done' : 'KYC incomplete — click to verify'}
                className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                  user?.kycVerified
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                }`}
              >
                {user?.kycVerified
                  ? <><ShieldCheck size={10} /> Verified</>
                  : <><ShieldX size={10} /> Not Verified</>
                }
              </button>
            </div>
          </div>

          {/* SECTION 2: Navigation Links */}
          <div className="space-y-0.5">
            <button 
              onClick={() => handleNavigation(isClient ? '/client/dashboard' : '/freelancer/dashboard')}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200 text-left font-semibold group"
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard size={15} className="text-muted-foreground group-hover:text-primary transition-colors" /> 
                <span>Dashboard</span>
              </div>
              <ChevronRight size={12} className="text-muted-foreground/45 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </button>

            {!isClient && (
              <button 
                onClick={() => handleNavigation('/freelancer/earnings')}
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200 text-left font-semibold group"
              >
                <div className="flex items-center gap-3">
                  <Wallet size={15} className="text-muted-foreground group-hover:text-emerald-500 transition-colors" /> 
                  <span>Financial Ledger & Wallet</span>
                </div>
                <ChevronRight size={12} className="text-muted-foreground/45 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </button>
            )}

            <button 
              onClick={() => handleNavigation('/profile')}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200 text-left font-semibold group"
            >
              <div className="flex items-center gap-3">
                <User size={15} className="text-muted-foreground group-hover:text-indigo-500 transition-colors" /> 
                <span>My Profile</span>
              </div>
              <ChevronRight size={12} className="text-muted-foreground/45 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </button>

            <button 
              onClick={() => handleNavigation('/shared/settings')}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200 text-left font-semibold group"
            >
              <div className="flex items-center gap-3">
                <Settings size={15} className="text-muted-foreground group-hover:text-amber-500 transition-colors" /> 
                <span>Settings</span>
              </div>
              <ChevronRight size={12} className="text-muted-foreground/45 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/60 my-1.5 mx-1"></div>

          {/* SECTION 3: Standard Logout Button */}
          <button 
            onClick={handleLogoutAction}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-rose-500/90 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all duration-150 text-left font-bold group"
          >
            <LogOut size={15} className="text-rose-500/70 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" /> 
            <span>Log Out</span>
          </button>

        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
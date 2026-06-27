import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  LogOut, MapPin, LayoutDashboard, MessageSquare,
  Wallet, Settings, User, TrendingUp, PlusCircle, Menu, X, Briefcase
} from 'lucide-react';
import { logout } from '../actions/authSlice';
import Notifications from '../components/Notifications';
import Logo from '../components/Logo';

// Routes must match App.jsx routing tree exactly
const clientNav = [
  { to: '/client/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/client/jobs',         icon: Briefcase,       label: 'Jobs Posted' },
  { to: '/shared/messages',     icon: MessageSquare,   label: 'Messages' },
  { to: '/shared/wallet',       icon: Wallet,          label: 'Wallet' },
  { to: '/shared/settings',     icon: Settings,        label: 'Settings' },
];


const freelancerNav = [
  { to: '/freelancer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile',              icon: User,            label: 'My Profile' },
  { to: '/freelancer/earnings',  icon: TrendingUp,      label: 'Earnings' },
  { to: '/shared/messages',      icon: MessageSquare,   label: 'Messages' },
  { to: '/shared/wallet',        icon: Wallet,          label: 'Wallet' },
  { to: '/shared/settings',      icon: Settings,        label: 'Settings' },
];

const SidebarContent = ({ role, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const nav = role?.toUpperCase() === 'CLIENT' ? clientNav : freelancerNav;

  // Fetch unread messages count
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages/conversations').then((r) => r.data?.conversations ?? r.data ?? []),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const unreadMessagesCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <Link to="/" className="flex items-center cursor-pointer">
          <Logo className="w-6 h-6" textClassName="text-xl" />
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-muted-foreground hover:text-foreground p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3 px-3 py-3 bg-muted/40 rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden text-primary-foreground">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : (user?.name?.[0] || 'U')}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate text-foreground">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground capitalize">{role?.toLowerCase()}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => {
          const isMessages = to === '/shared/messages';
          return (
            <NavLink key={to} to={to} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-3 rounded-xl font-medium text-sm transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`
              }>
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 shrink-0" />
                <span>{label}</span>
              </div>
              {isMessages && unreadMessagesCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm shrink-0">
                  {unreadMessagesCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors font-medium text-sm">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>
    </div>
  );
};

const DashboardLayout = () => {
  const { role } = useSelector((s) => s.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col fixed h-full z-10">
        <SidebarContent role={role} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border z-50 flex flex-col">
            <SidebarContent role={role} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground p-1">
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/" className="flex items-center cursor-pointer">
            <Logo showText={false} className="w-7 h-7" />
          </Link>
          <Notifications />
        </div>

        <div className="hidden md:flex items-center justify-end px-6 py-3 bg-background/50 border-b border-border sticky top-0 z-30">
          <Notifications />
        </div>

        <div className="flex-1 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
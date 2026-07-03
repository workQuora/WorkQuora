import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard, Users, Briefcase, CreditCard, BarChart3, ScrollText,
  Shield, ShieldCheck, Scale, Settings, LogOut, ChevronLeft, ChevronRight, Search, Bell, Menu, MonitorPlay
} from 'lucide-react';
import { adminLogout } from '../store/adminAuthSlice';
import adminApi from '../api/adminApi';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Clients', icon: Users, path: '/admin/clients' },
  { label: 'Freelancers', icon: Briefcase, path: '/admin/freelancers' },
  { label: 'KYC Queue', icon: ShieldCheck, path: '/admin/kyc' },
  { label: 'Disputes', icon: Scale, path: '/admin/disputes' },
  { label: 'Tasks / Jobs', icon: Briefcase, path: '/admin/tasks' },
  { label: 'Advertisements', icon: MonitorPlay, path: '/admin/ads' },
  { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { label: 'Audit Logs', icon: ScrollText, path: '/admin/audit-logs' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { admin } = useSelector((s) => s.adminAuth);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try { await adminApi.post('/auth/logout'); } catch {}
    dispatch(adminLogout());
    navigate('/admin/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Shield className="w-4 h-4 text-white" />
        </div>
        {!collapsed && <span className="text-sm font-extrabold text-white tracking-tight">WorkQuora Admin</span>}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
              isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)' } : {}}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Admin profile card */}
      <div className="px-3 pb-4 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{admin?.name || 'Admin'}</p>
              <p className="text-[10px] text-gray-500 truncate">{admin?.role === 'SUPER_ADMIN' ? '🔰 Super Admin' : '🛡️ Admin'}</p>
            </div>
          </div>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
          <LogOut className="w-4 h-4" />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a14', color: '#e2e8f0' }}>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen z-40 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
        style={{ background: 'rgba(15,15,26,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <SidebarContent />
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center border text-gray-400 hover:text-white transition-colors"
          style={{ background: '#1a1a2e', borderColor: 'rgba(255,255,255,0.1)' }}>
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />}
      <aside className={`lg:hidden fixed top-0 left-0 h-screen w-60 z-50 transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: '#0f0f1a', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <SidebarContent />
      </aside>

      {/* Main area */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 border-b"
          style={{ background: 'rgba(10,10,20,0.8)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-gray-400 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input type="text" placeholder="Search anything..."
                className="w-64 pl-9 pr-4 py-1.5 rounded-lg text-xs text-gray-300 placeholder:text-gray-600 outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400">
              <Bell className="w-4 h-4" />
            </button>
            <div className="text-xs text-gray-500">
              <span className="text-gray-300 font-semibold">{admin?.name}</span>
              <span className="mx-1.5">·</span>
              <span className={admin?.isSuperAdmin ? 'text-yellow-400' : 'text-primary'}>{admin?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

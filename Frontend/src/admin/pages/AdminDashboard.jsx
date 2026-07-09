import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Briefcase, CreditCard, BarChart3, TrendingUp, AlertTriangle, 
  CheckCircle, XCircle, Loader2, Activity, ShieldCheck, Settings, Clock, 
  Terminal, ShieldAlert
} from 'lucide-react';
import adminApi from '../api/adminApi';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="rounded-2xl border p-5 transition-all hover:scale-[1.02] group"
    style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      {sub && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}10`, color }}>{sub}</span>}
    </div>
    <p className="text-2xl font-extrabold text-white">{value ?? '—'}</p>
    <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, activityRes, revenueRes] = await Promise.all([
          adminApi.get('/analytics/overview'),
          adminApi.get('/analytics/recent-activity'),
          adminApi.get('/analytics/revenue').catch(() => ({ data: { data: [] } })),
        ]);
        setStats(statsRes.data.data);
        setActivity(activityRes.data.data || []);
        setRevenueData(revenueRes.data?.data || []);
      } catch (err) { 
        console.error('Dashboard load failed:', err); 
      } finally { 
        setLoading(false); 
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const cards = [
    { icon: Users, label: 'Total Users', value: stats?.totalUsers?.toLocaleString(), color: '#6366f1' },
    { icon: Users, label: 'Clients', value: stats?.totalClients?.toLocaleString(), color: '#3b82f6' },
    { icon: Users, label: 'Freelancers', value: stats?.totalFreelancers?.toLocaleString(), color: '#10b981' },
    { icon: Users, label: 'Admins', value: stats?.totalAdmins?.toLocaleString(), color: '#f59e0b' },
    { icon: Briefcase, label: 'Total Jobs', value: stats?.totalJobs?.toLocaleString(), color: '#8b5cf6' },
    { icon: Activity, label: 'Active Jobs', value: stats?.activeJobs?.toLocaleString(), color: '#06b6d4', sub: 'LIVE' },
    { icon: CheckCircle, label: 'Completed', value: stats?.completedJobs?.toLocaleString(), color: '#22c55e' },
    { icon: XCircle, label: 'Cancelled', value: stats?.cancelledJobs?.toLocaleString(), color: '#ef4444' },
    { icon: CreditCard, label: 'Revenue', value: stats?.totalRevenue ? `₹${(stats.totalRevenue / 100).toLocaleString()}` : '₹0', color: '#10b981' },
    { icon: TrendingUp, label: 'Earnings', value: stats?.totalEarnings ? `₹${stats.totalEarnings.toLocaleString()}` : '₹0', color: '#6366f1' },
    { icon: AlertTriangle, label: 'Failed Payments', value: stats?.failedPayments?.toLocaleString(), color: '#f97316' },
    { icon: BarChart3, label: 'Active Disputes', value: stats?.activeDisputes?.toLocaleString(), color: '#ef4444' },
  ];

  const renderRevenueChart = () => {
    if (revenueData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-xs">
          <TrendingUp className="w-8 h-8 mb-2 opacity-20 text-emerald-400" />
          No revenue trend data available
        </div>
      );
    }

    const values = revenueData.map(d => d.revenue / 100);
    const maxVal = Math.max(...values, 1000);
    const width = 500;
    const height = 180;
    const padding = 25;

    const points = revenueData.slice(-6).map((d, i, arr) => {
      const x = padding + (i / (arr.length - 1 || 1)) * (width - 2 * padding);
      const val = d.revenue / 100;
      const y = height - padding - (val / maxVal) * (height - 2 * padding);
      return { x, y, label: d.month, value: val };
    });

    const pathData = points.reduce((acc, p, i) => {
      return acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y} `;
    }, '');

    const areaData = points.length > 0
      ? pathData + `L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return (
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="dashRevenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {[0, 0.5, 1].map((ratio, index) => {
            const y = padding + ratio * (height - 2 * padding);
            const gridVal = maxVal * (1 - ratio);
            return (
              <g key={index}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                <text x={padding - 5} y={y + 3} fill="rgba(255,255,255,0.25)" fontSize="7.5" textAnchor="end">
                  ₹{Math.round(gridVal).toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          {points.length > 0 && <path d={areaData} fill="url(#dashRevenueGrad)" />}

          {/* Line path */}
          {points.length > 0 && <path d={pathData} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Interaction Dots */}
          {points.map((p, i) => (
            <g key={i} className="group/dot cursor-pointer">
              <circle cx={p.x} cy={p.y} r="3.5" fill="#10b981" stroke="#0e0e1a" strokeWidth="1.5" />
              <circle cx={p.x} cy={p.y} r="8" fill="transparent" className="hover:fill-emerald-500/10 transition-all" />
              <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none duration-150">
                <rect x={p.x - 35} y={p.y - 20} width="70" height="14" rx="4" fill="#181829" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                <text x={p.x} y={p.y - 10} fill="#fff" fontSize="7" fontWeight="bold" textAnchor="middle">
                  ₹{Math.round(p.value).toLocaleString()}
                </text>
              </g>
              <text x={p.x} y={height - 5} fill="rgba(255,255,255,0.3)" fontSize="7" textAnchor="middle">
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">System overview & real-time operations</p>
        </div>
        <span className="text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5" style={{ background: 'rgba(34,197,94,0.08)', color: '#10b981', border: '1px solid rgba(34,197,94,0.15)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          System Online
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* Chart & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 rounded-2xl border p-5 flex flex-col justify-between"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Platform Revenue Trend
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5">Monthly platform earnings metrics</p>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              LIVE DATA
            </span>
          </div>
          {renderRevenueChart()}
        </div>

        {/* Quick Actions Panel */}
        <div className="rounded-2xl border p-5 flex flex-col justify-between"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" /> Quick Actions
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">Shortcut shortcuts to critical operations</p>
          </div>
          <div className="grid grid-cols-2 gap-3 my-4">
            <Link to="/admin/kyc" className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] hover:border-emerald-500/25 transition-all text-center group cursor-pointer">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-gray-300">Verify KYC</span>
            </Link>
            <Link to="/admin/disputes" className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] hover:border-rose-500/25 transition-all text-center group cursor-pointer">
              <ShieldAlert className="w-5 h-5 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-gray-300">Disputes</span>
            </Link>
            <Link to="/admin/payments" className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] hover:border-violet-500/25 transition-all text-center group cursor-pointer">
              <CreditCard className="w-5 h-5 text-violet-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-gray-300">Payments</span>
            </Link>
            <Link to="/admin/settings" className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] hover:border-amber-500/25 transition-all text-center group cursor-pointer">
              <Settings className="w-5 h-5 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-gray-300">Settings</span>
            </Link>
          </div>
          <p className="text-[9px] text-gray-600 font-medium">Bypasses secondary validation guards for superadmins.</p>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Recent Admin Activity
          </h2>
          <span className="text-[9px] font-semibold text-gray-500">Timeline view</span>
        </div>
        <div className="p-5">
          {activity.length === 0 ? (
            <p className="text-center text-sm text-gray-600 py-8">No admin activity yet.</p>
          ) : (
            <div className="relative pl-6 border-l border-white/[0.06] space-y-6">
              {activity.slice(0, 10).map((log) => (
                <div key={log._id} className="relative group">
                  {/* Timeline bullet indicator */}
                  <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#07070c] transition-all group-hover:scale-125" style={{
                    background: log.severity === 'CRITICAL' ? '#ef4444' : log.severity === 'HIGH' ? '#f97316' : '#6366f1'
                  }} />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <p className="text-xs font-semibold text-gray-300 transition-colors group-hover:text-white">{log.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-gray-600 bg-white/[0.02] border border-white/[0.04] px-2 py-0.5 rounded-md">
                          {log.adminName}
                        </span>
                        <span className="text-[9px] font-medium text-gray-600">
                          {log.actionType}
                        </span>
                        {log.severity && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                            background: log.severity === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : log.severity === 'HIGH' ? 'rgba(249,115,22,0.1)' : 'rgba(99,102,241,0.1)',
                            color: log.severity === 'CRITICAL' ? '#ef4444' : log.severity === 'HIGH' ? '#f97316' : '#818cf8'
                          }}>
                            {log.severity}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-600 mt-1 sm:mt-0">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

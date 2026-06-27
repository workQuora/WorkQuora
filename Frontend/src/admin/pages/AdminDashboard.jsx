import React, { useEffect, useState } from 'react';
import { Users, Briefcase, CreditCard, BarChart3, TrendingUp, AlertTriangle, CheckCircle, XCircle, Loader2, Activity } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          adminApi.get('/analytics/overview'),
          adminApi.get('/analytics/recent-activity'),
        ]);
        setStats(statsRes.data.data);
        setActivity(activityRes.data.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-white">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">System overview & analytics</p>
        </div>
        <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
          ● System Online
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-bold text-white">Recent Admin Activity</h2>
        </div>
        <div className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
          {activity.length === 0 ? (
            <p className="text-center text-sm text-gray-600 py-8">No admin activity yet.</p>
          ) : (
            activity.slice(0, 10).map((log) => (
              <div key={log._id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                    background: log.severity === 'CRITICAL' ? '#ef4444' : log.severity === 'HIGH' ? '#f97316' : '#6366f1'
                  }} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-300 truncate">{log.description}</p>
                    <p className="text-[10px] text-gray-600">{log.adminName} · {log.actionType}</p>
                  </div>
                </div>
                <span className="text-[10px] text-gray-600 flex-shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

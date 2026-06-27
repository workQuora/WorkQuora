import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Download, PieChart, Loader2, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const Earnings = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const { data, isLoading } = useQuery({
    queryKey: ['freelancer-revenue'],
    queryFn: () => api.get('/analytics/freelancer-revenue').then((r) => r.data?.data ?? r.data),
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get('/payments/transactions', { params: { limit: 10 } }).then((r) => r.data?.data ?? r.data),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const totalEarnings = data?.totalEarnings || 0;
  const thisMonth = data?.thisMonth || 0;
  const weeklyData = data?.weeklyData || [];
  const distanceStats = data?.locationStats || [];
  const transactions = txData?.transactions || [];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background text-foreground p-6 lg:p-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Earnings</h1>
            <p className="text-muted-foreground mt-1 text-sm">Track your income and performance</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            <button onClick={() => navigate('/')} 
              className="flex items-center gap-2 bg-accent/40 border border-border hover:bg-accent px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
              <Home className="w-4 h-4 text-primary" />
              <span>Home</span>
            </button>
            <button
              onClick={() => {
                const csv = transactions.map((t) => `${t.description},${t.amount},${t.type},${t.createdAt}`).join('\n');
                const blob = new Blob([`Description,Amount,Type,Date\n${csv}`], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'earnings.csv'; a.click();
              }}
              className="bg-card hover:bg-accent border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-indigo-600/10 via-card to-card border border-indigo-500/30 p-6 rounded-3xl shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-500/20 p-3 rounded-xl"><DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /></div>
                  {data?.growthPercent != null && (
                    <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +{data.growthPercent}%
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Total Earnings</p>
                <h2 className="text-4xl font-extrabold text-foreground">₹{totalEarnings.toLocaleString('en-IN')}</h2>
              </div>
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-muted p-3 rounded-xl"><PieChart className="w-6 h-6 text-muted-foreground" /></div>
                </div>
                <p className="text-muted-foreground text-sm font-medium mb-1">This Month</p>
                <h2 className="text-4xl font-extrabold text-foreground">₹{thisMonth.toLocaleString('en-IN')}</h2>
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-6 text-foreground">Recent Transactions</h3>
              {txLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet.</p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx._id || tx.id}
                      className="flex justify-between items-center p-4 bg-background/50 rounded-2xl border border-border/50 hover:border-border transition-colors">
                      <div>
                        <h4 className="font-bold text-foreground mb-1 text-sm">{tx.description || 'Payment'}</h4>
                        <p className="text-xs text-muted-foreground">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN') : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-extrabold text-base ${tx.type === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                          {tx.type === 'CREDIT' ? '+' : '-'}₹{(tx.amount || 0).toLocaleString('en-IN')}
                        </p>
                        <span className={`text-[10px] font-bold uppercase ${tx.status === 'completed' ? 'text-muted-foreground' : 'text-amber-500'}`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Earnings by Distance */}
          <div className="space-y-8">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6 text-foreground">Earnings by Distance</h3>
              {distanceStats.length > 0 ? (
                <div className="space-y-6">
                  {distanceStats.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-muted-foreground font-medium">{item.label}</span>
                        <span className="text-foreground font-bold">{item.value}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: item.value }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {[
                    { label: 'Within 5km', value: '0%', color: 'bg-indigo-500' },
                    { label: '5 – 15km', value: '0%', color: 'bg-blue-500' },
                    { label: '15 – 30km', value: '0%', color: 'bg-purple-500' },
                    { label: '30km+', value: '0%', color: 'bg-gray-600' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-muted-foreground font-medium">{item.label}</span>
                        <span className="text-foreground font-bold">{item.value}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={`${item.color} h-2 rounded-full`} style={{ width: item.value }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  <strong className="text-indigo-600 dark:text-indigo-400">Tip: </strong>Focus on nearby jobs to maximize earnings and response time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earnings;
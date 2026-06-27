import React, { useEffect, useState } from 'react';
import { Loader2, TrendingUp, Users, Briefcase, Calendar, BarChart3 } from 'lucide-react';
import adminApi from '../api/adminApi';

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [userGrowth, setUserGrowth] = useState([]);
  const [revenueGrowth, setRevenueGrowth] = useState([]);
  const [taskGrowth, setTaskGrowth] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [uRes, rRes, tRes] = await Promise.all([
          adminApi.get('/analytics/users'),
          adminApi.get('/analytics/revenue'),
          adminApi.get('/analytics/tasks'),
        ]);
        setUserGrowth(uRes.data.data || []);
        setRevenueGrowth(rRes.data.data || []);
        setTaskGrowth(tRes.data.data || []);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  // --- SVG Custom Chart Renderers ---

  // 1. Line / Area Chart for Revenue (with interactive SVG path)
  const renderRevenueChart = () => {
    if (revenueGrowth.length === 0) return <div className="text-center py-12 text-gray-500 text-xs">No data available</div>;

    const values = revenueGrowth.map(d => d.revenue / 100); // convert paise to rupees
    const maxVal = Math.max(...values, 1000); // fall back to 1000 minimum scale
    const width = 500;
    const height = 200;
    const padding = 35;

    const points = revenueGrowth.map((d, i) => {
      const x = padding + (i / (revenueGrowth.length - 1 || 1)) * (width - 2 * padding);
      const val = d.revenue / 100;
      const y = height - padding - (val / maxVal) * (height - 2 * padding);
      return { x, y, label: d.month, value: val };
    });

    const pathData = points.reduce((acc, p, i) => {
      return acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y} `;
    }, '');

    const areaData = pathData + `L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue Growth (INR)</h3>
          </div>
          <span className="text-xs font-semibold text-emerald-400">Max: ₹{maxVal.toLocaleString()}</span>
        </div>
        <div className="relative p-4 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = padding + ratio * (height - 2 * padding);
              const gridVal = maxVal * (1 - ratio);
              return (
                <g key={index}>
                  <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                  <text x={padding - 8} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end">
                    ₹{Math.round(gridVal).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Filled Area */}
            {points.length > 0 && (
              <path d={areaData} fill="url(#revenueGrad)" />
            )}

            {/* Line Path */}
            {points.length > 0 && (
              <path d={pathData} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Data Points / Interaction dots */}
            {points.map((p, i) => (
              <g key={i} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="4" fill="#10b981" stroke="#0a0a14" strokeWidth="2" />
                <circle cx={p.x} cy={p.y} r="8" fill="transparent" className="hover:fill-emerald-400/20 transition-all" />
                {/* Tooltip on Hover */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-200">
                  <rect x={p.x - 45} y={p.y - 30} width="90" height="20" rx="6" fill="#181829" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <text x={p.x} y={p.y - 17} fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
                    ₹{Math.round(p.value).toLocaleString()}
                  </text>
                </g>
                {/* X Axis Labels */}
                {i % 2 === 0 && (
                  <text x={p.x} y={height - 10} fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">
                    {p.label}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  // 2. Bar Chart for User Registrations
  const renderUserChart = () => {
    if (userGrowth.length === 0) return <div className="text-center py-12 text-gray-500 text-xs">No data available</div>;

    const values = userGrowth.map(d => d.count);
    const maxVal = Math.max(...values, 5); // default scaling
    const width = 500;
    const height = 200;
    const padding = 35;
    const chartWidth = width - 2 * padding;
    const barWidth = Math.max(8, (chartWidth / userGrowth.length) * 0.5);
    const barSpacing = (chartWidth - barWidth * userGrowth.length) / (userGrowth.length - 1 || 1);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">User Registrations</h3>
          </div>
          <span className="text-xs font-semibold text-indigo-400">Max: {maxVal}</span>
        </div>
        <div className="relative p-4 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = padding + ratio * (height - 2 * padding);
              const gridVal = maxVal * (1 - ratio);
              return (
                <g key={index}>
                  <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                  <text x={padding - 8} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end">
                    {Math.round(gridVal)}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {userGrowth.map((d, i) => {
              const x = padding + i * (barWidth + barSpacing);
              const barHeight = (d.count / maxVal) * (height - 2 * padding);
              const y = height - padding - barHeight;

              return (
                <g key={i} className="group cursor-pointer">
                  {/* Background full bar area for easy hover */}
                  <rect x={x - 2} y={padding} width={barWidth + 4} height={height - 2 * padding} fill="transparent" />
                  {/* Actual Visual Bar */}
                  <rect x={x} y={y} width={barWidth} height={barHeight} rx="3" fill="linear-gradient(to top, #6366f1, #8b5cf6)" style={{ fill: '#6366f1' }} className="transition-all group-hover:fill-indigo-400" />
                  {/* Tooltip */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-200">
                    <rect x={x + barWidth / 2 - 25} y={y - 25} width="50" height="18" rx="5" fill="#181829" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <text x={x + barWidth / 2} y={y - 13} fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {d.count}
                    </text>
                  </g>
                  {/* Labels */}
                  {i % 2 === 0 && (
                    <text x={x + barWidth / 2} y={height - 10} fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">
                      {d.month}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  // 3. Area Chart for Task/Job Creation
  const renderTaskChart = () => {
    if (taskGrowth.length === 0) return <div className="text-center py-12 text-gray-500 text-xs">No data available</div>;

    const values = taskGrowth.map(d => d.count);
    const maxVal = Math.max(...values, 5);
    const width = 500;
    const height = 200;
    const padding = 35;

    const points = taskGrowth.map((d, i) => {
      const x = padding + (i / (taskGrowth.length - 1 || 1)) * (width - 2 * padding);
      const y = height - padding - (d.count / maxVal) * (height - 2 * padding);
      return { x, y, label: d.month, value: d.count };
    });

    const pathData = points.reduce((acc, p, i) => {
      return acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y} `;
    }, '');

    const areaData = pathData + `L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Job / Task Postings</h3>
          </div>
          <span className="text-xs font-semibold text-violet-400">Max: {maxVal}</span>
        </div>
        <div className="relative p-4 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = padding + ratio * (height - 2 * padding);
              const gridVal = maxVal * (1 - ratio);
              return (
                <g key={index}>
                  <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                  <text x={padding - 8} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end">
                    {Math.round(gridVal)}
                  </text>
                </g>
              );
            })}

            {/* Filled Area */}
            {points.length > 0 && (
              <path d={areaData} fill="url(#taskGrad)" />
            )}

            {/* Line Path */}
            {points.length > 0 && (
              <path d={pathData} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Data Points */}
            {points.map((p, i) => (
              <g key={i} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="4" fill="#8b5cf6" stroke="#0a0a14" strokeWidth="2" />
                <circle cx={p.x} cy={p.y} r="8" fill="transparent" className="hover:fill-violet-400/20 transition-all" />
                {/* Tooltip */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-200">
                  <rect x={p.x - 30} y={p.y - 25} width="60" height="18" rx="5" fill="#181829" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <text x={p.x} y={p.y - 13} fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
                    {p.value} Jobs
                  </text>
                </g>
                {/* Labels */}
                {i % 2 === 0 && (
                  <text x={p.x} y={height - 10} fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">
                    {p.label}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">System Analytics</h1>
          <p className="text-xs text-gray-500">Analyze registrations, job volumes, and platform financial transactions</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-white/[0.02] text-[10px] font-bold text-gray-400" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Calendar className="w-3.5 h-3.5" />
          Last 12 Months
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="p-6 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          {renderUserChart()}
        </div>

        {/* Task Growth Chart */}
        <div className="p-6 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          {renderTaskChart()}
        </div>

        {/* Revenue Growth Chart */}
        <div className="p-6 rounded-2xl border lg:col-span-2" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          {renderRevenueChart()}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Eye, XCircle, CheckCircle, RotateCcw, X } from 'lucide-react';
import adminApi from '../api/adminApi';

const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchTasks = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.get('/tasks', { params });
      setTasks(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAction = async (taskId, action) => {
    if (!confirm(`Are you sure you want to ${action} this task?`)) return;
    try {
      await adminApi.put(`/tasks/${taskId}/${action}`, { reason: 'Admin action' });
      fetchTasks(pagination.page);
      setSelected(null);
    } catch (err) { alert(err.response?.data?.message || 'Action failed'); }
  };

  const viewDetail = async (taskId) => {
    try {
      const res = await adminApi.get(`/tasks/${taskId}`);
      setSelected(res.data.data);
    } catch (err) { console.error(err); }
  };

  const statusColors = {
    open: 'bg-blue-500/10 text-blue-400',
    'in-progress': 'bg-yellow-500/10 text-yellow-400',
    completed: 'bg-emerald-500/10 text-emerald-400',
    cancelled: 'bg-red-500/10 text-red-400',
  };

  return (
    <div>
      <h1 className="text-xl font-extrabold text-white mb-1">Task Management</h1>
      <p className="text-xs text-gray-500 mb-6">View and manage all platform jobs/tasks</p>

      <div className="flex gap-3 mb-6">
        {['', 'open', 'in-progress', 'completed', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${statusFilter === s ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            style={statusFilter === s ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    {['Title', 'Client', 'Freelancer', 'Status', 'Budget', 'Created', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
                  {tasks.map((t) => (
                    <tr key={t._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-xs font-semibold text-gray-200 max-w-[200px] truncate">{t.title}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{t.clientInfo?.name || '—'}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{t.freelancerInfo?.name || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[t.status] || 'text-gray-400'}`}>{t.status}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-300">₹{t.budget || 0}</td>
                      <td className="px-5 py-3 text-[10px] text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => viewDetail(t._id)} title="View" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-indigo-400"><Eye className="w-3.5 h-3.5" /></button>
                          {t.status !== 'cancelled' && <button onClick={() => handleAction(t._id, 'cancel')} title="Cancel" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-400"><XCircle className="w-3.5 h-3.5" /></button>}
                          {t.status !== 'completed' && <button onClick={() => handleAction(t._id, 'complete')} title="Complete" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /></button>}
                          {t.status !== 'open' && <button onClick={() => handleAction(t._id, 'reopen')} title="Reopen" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-yellow-400"><RotateCcw className="w-3.5 h-3.5" /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-gray-500">{pagination.total} tasks · Page {pagination.page}/{pagination.pages}</p>
              <div className="flex gap-1.5">
                <button onClick={() => fetchTasks(pagination.page - 1)} disabled={pagination.page <= 1} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => fetchTasks(pagination.page + 1)} disabled={pagination.page >= pagination.pages} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Task Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl border p-6" onClick={(e) => e.stopPropagation()}
            style={{ background: '#12121e', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Task Detail</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              {[['Title', selected.title], ['Status', selected.status], ['Category', selected.category], ['Budget', `₹${selected.budget || 0}`],
                ['Client', selected.clientInfo?.name || '—'], ['Freelancer', selected.freelancerInfo?.name || '—'],
                ['Created', new Date(selected.createdAt).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs"><span className="text-gray-500">{k}</span><span className="text-gray-200 font-semibold">{v}</span></div>
              ))}
              {selected.description && <p className="text-xs text-gray-400 mt-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>{selected.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTasks;

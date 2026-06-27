import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Eye, RefreshCw, X, ShieldAlert, FileJson } from 'lucide-react';
import adminApi from '../api/adminApi';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (targetTypeFilter) params.targetType = targetTypeFilter;
      const res = await adminApi.get('/audit', { params });
      setLogs(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [targetTypeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const viewLogDetail = async (id) => {
    try {
      const res = await adminApi.get(`/audit/${id}`);
      setSelectedLog(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const severityColors = {
    LOW: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    MEDIUM: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    HIGH: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    CRITICAL: 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse',
  };

  const getLogSeverity = (actionType) => {
    if (['ADMIN_DELETE', 'ADMIN_SUSPEND', 'PAYMENT_REFUND', 'USER_BLOCK'].includes(actionType)) return 'CRITICAL';
    if (['ADMIN_CREATE', 'ADMIN_ACTIVATE', 'USER_SUSPEND', 'KYC_MODIFY', 'BANK_MODIFY'].includes(actionType)) return 'HIGH';
    if (['TASK_CANCEL', 'TASK_COMPLETE'].includes(actionType)) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white mb-1">System Audit Logs</h1>
        <p className="text-xs text-gray-500">Immutable trail of administrative actions for compliance and accountability</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={targetTypeFilter}
          onChange={(e) => setTargetTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-xs text-gray-300 outline-none cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <option value="">All Targets</option>
          <option value="USER">User Account</option>
          <option value="TASK">Tasks / Jobs</option>
          <option value="PAYMENT">Payments</option>
          <option value="KYC">KYC Details</option>
          <option value="ADMIN">Admin Users</option>
        </select>

        <button
          onClick={() => fetchLogs(1)}
          className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table container */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">No audit logs found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    {['Severity', 'Timestamp', 'Admin', 'Action', 'Target', 'Description', 'Details'].map((h) => (
                      <th key={h} className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
                  {logs.map((log) => {
                    const sev = getLogSeverity(log.actionType);
                    return (
                      <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${severityColors[sev]}`}>
                            {sev}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[10px] text-gray-500 font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-xs font-semibold text-gray-200">{log.adminName}</p>
                          <p className="text-[9px] text-gray-600 font-mono truncate max-w-[80px]" title={log.adminId}>{log.adminId}</p>
                        </td>
                        <td className="px-5 py-3 text-xs font-semibold text-gray-400">{log.actionType}</td>
                        <td className="px-5 py-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-gray-300">
                            {log.targetType}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-300 max-w-[250px] truncate" title={log.description}>
                          {log.description}
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => viewLogDetail(log._id)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-indigo-400 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-gray-500">{pagination.total} logs · Page {pagination.page} of {pagination.pages}</p>
              <div className="flex gap-1.5">
                <button onClick={() => fetchLogs(pagination.page - 1)} disabled={pagination.page <= 1} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => fetchLogs(pagination.page + 1)} disabled={pagination.page >= pagination.pages} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedLog(null)}>
          <div className="w-full max-w-2xl rounded-2xl border p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}
            style={{ background: '#12121e', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Audit Log Details</h2>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4">
              {/* Top basic summary metadata */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {[
                  ['Action Type', selectedLog.actionType],
                  ['Target Type', selectedLog.targetType],
                  ['Target ID', selectedLog.targetId || '—'],
                  ['Admin Name', selectedLog.adminName],
                  ['IP Address', selectedLog.ipAddress || '—'],
                  ['Timestamp', new Date(selectedLog.createdAt).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{k}</p>
                    <p className="text-xs font-semibold text-gray-200 mt-0.5 truncate select-all">{v}</p>
                  </div>
                ))}
              </div>

              {/* Description box */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">{selectedLog.description}</p>
              </div>

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">User Agent</p>
                  <p className="text-[10px] text-gray-500 font-mono leading-relaxed truncate select-all" title={selectedLog.userAgent}>{selectedLog.userAgent}</p>
                </div>
              )}

              {/* Data Diff (Old vs New) */}
              {(selectedLog.oldData || selectedLog.newData) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileJson className="w-3.5 h-3.5 text-red-400" />
                      <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">Before Changes</h3>
                    </div>
                    <pre className="p-3 rounded-xl text-[10px] font-mono text-gray-400 overflow-x-auto max-h-48 overflow-y-auto"
                      style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      {selectedLog.oldData ? JSON.stringify(selectedLog.oldData, null, 2) : 'No prior state recorded.'}
                    </pre>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileJson className="w-3.5 h-3.5 text-emerald-400" />
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">After Changes</h3>
                    </div>
                    <pre className="p-3 rounded-xl text-[10px] font-mono text-gray-200 overflow-x-auto max-h-48 overflow-y-auto"
                      style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      {selectedLog.newData ? JSON.stringify(selectedLog.newData, null, 2) : 'No modifications recorded.'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;

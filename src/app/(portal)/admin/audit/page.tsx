'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockAuditLogs, AuditLog } from '@/lib/mock-data';
import { FileLock, Search, Filter, Download, AlertTriangle, ShieldCheck, User, Wrench, Map, LogIn } from 'lucide-react';

const ACTION_STYLES: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  USER_CREATED: { color: 'text-blue-700', bg: 'bg-blue-100', icon: <User size={14} /> },
  MOVEMENT_APPROVED: { color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <ShieldCheck size={14} /> },
  JOB_UPDATED: { color: 'text-amber-700', bg: 'bg-amber-100', icon: <Wrench size={14} /> },
  AC_DEACTIVATED: { color: 'text-red-700', bg: 'bg-red-100', icon: <AlertTriangle size={14} /> },
  MAINTENANCE_SCHEDULED: { color: 'text-purple-700', bg: 'bg-purple-100', icon: <Wrench size={14} /> },
  MOVEMENT_REQUESTED: { color: 'text-teal-700', bg: 'bg-teal-100', icon: <Map size={14} /> },
  LOGIN: { color: 'text-slate-700', bg: 'bg-slate-100', icon: <LogIn size={14} /> },
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');

  const filtered = mockAuditLogs.filter(log => {
    const matchSearch = [log.actor, log.action, log.entityId, log.details].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchEntity = entityFilter === 'All' || log.entityType === entityFilter;
    return matchSearch && matchEntity;
  });

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">Complete audit trail of all user actions in the system.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { label: 'Total Events', count: mockAuditLogs.length, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Today', count: 3, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Modifications', count: mockAuditLogs.filter(l => l.action !== 'LOGIN').length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Logins', count: mockAuditLogs.filter(l => l.action === 'LOGIN').length, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
        ]).map(item => (
          <div key={item.label} className={`rounded-xl border p-4 ${item.bg}`}>
            <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by actor, action, entity..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', 'AC', 'User', 'Movement', 'Maintenance', 'System'].map(e => (
            <button key={e} onClick={() => setEntityFilter(e)} className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${entityFilter === e ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{e}</button>
          ))}
        </div>
      </div>

      {/* Logs Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Timestamp', 'Actor', 'Action', 'Entity', 'Details', 'IP'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log, i) => {
                const style = ACTION_STYLES[log.action] || ACTION_STYLES['LOGIN'];
                return (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-900">{log.actor}</div>
                      <div className="text-xs text-slate-400">{log.actorRole.replace('_', ' ')}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.color} ${style.bg}`}>
                        {style.icon} {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-xs text-slate-600 font-medium">{log.entityType}</div>
                      <div className="text-xs text-slate-400 font-mono">{log.entityId}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs max-w-[200px]">
                      <span className="line-clamp-2">{log.details}</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{log.ipAddress}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <FileLock size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No audit log entries found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

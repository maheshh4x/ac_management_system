'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockMovementRequests, MovementRequest } from '@/lib/mock-data';
import { MoveRight, Plus, Search, CheckCircle2, XCircle, Truck, X, Eye } from 'lucide-react';
import { ProtectedAction } from '@/components/auth/ProtectedRoute';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Approved: 'bg-blue-100 text-blue-700 border-blue-200',
  Rejected: 'bg-red-100 text-red-700 border-red-200',
  Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export function MovementPanel() {
  const [movements, setMovements] = useState<MovementRequest[]>(mockMovementRequests);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedMov, setSelectedMov] = useState<MovementRequest | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const filtered = movements.filter(m => {
    const matchSearch = [m.id, m.acId, m.fromLocation, m.toLocation, m.requestedBy].join(' ').toLowerCase().includes(search.toLowerCase());
    return matchSearch && (statusFilter === 'All' || m.status === statusFilter);
  });

  const handleApprove = (id: string) => {
    setMovements(prev => prev.map(m => m.id === id ? { ...m, status: 'Approved', approvedBy: 'Current User', approvedDate: new Date().toLocaleDateString() } : m));
    setSelectedMov(prev => prev?.id === id ? { ...prev, status: 'Approved' } : prev);
  };

  const handleReject = (id: string) => {
    setMovements(prev => prev.map(m => m.id === id ? { ...m, status: 'Rejected', approvedBy: 'Current User', approvedDate: new Date().toLocaleDateString(), rejectionReason: rejectReason || 'Not approved.' } : m));
    setSelectedMov(prev => prev?.id === id ? { ...prev, status: 'Rejected' } : prev);
    setShowRejectInput(false);
    setRejectReason('');
  };

  const stats = {
    pending: movements.filter(m => m.status === 'Pending').length,
    approved: movements.filter(m => m.status === 'Approved').length,
    completed: movements.filter(m => m.status === 'Completed').length,
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AC Movement Requests</h1>
          <p className="text-sm text-slate-500 mt-1">Review and approve requests to relocate AC units across campus.</p>
        </div>
        <ProtectedAction permission="CREATE_MOVEMENT_REQUEST">
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"><Plus size={16} /> New Request</button>
        </ProtectedAction>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Awaiting Approval', count: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Approved', count: stats.approved, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Completed', count: stats.completed, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
        ].map(item => <div key={item.label} className={`rounded-xl border p-4 ${item.bg}`}><p className={`text-2xl font-bold ${item.color}`}>{item.count}</p><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">{item.label}</p></div>)}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Search by request ID, AC, requester..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="flex gap-2 flex-wrap">{['All', 'Pending', 'Approved', 'Rejected', 'Completed'].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{s}</button>)}</div>
      </div>

      <div className="grid gap-4">
        {filtered.map((mov, i) => (
          <motion.div key={mov.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2"><span className="font-mono text-sm font-bold text-blue-700">{mov.id}</span><span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[mov.status]}`}>{mov.status}</span><span className="text-xs text-slate-400">• AC: <strong className="text-slate-700">{mov.acId}</strong></span></div>
                <div className="flex items-center gap-2 mt-3 text-sm flex-wrap"><div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 flex-1 min-w-[120px]"><p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider mb-0.5">FROM</p><p className="font-medium text-xs">{mov.fromLocation}</p></div><MoveRight size={20} className="text-blue-500 flex-shrink-0" /><div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 text-blue-800 flex-1 min-w-[120px]"><p className="text-[10px] uppercase text-blue-400 font-semibold tracking-wider mb-0.5">TO</p><p className="font-medium text-xs">{mov.toLocation}</p></div></div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-3"><span>👤 {mov.requestedBy} ({mov.requestedByRole.replace('_', ' ')})</span><span>📅 {mov.requestDate}</span>{mov.approvedBy && <span>✅ {mov.approvedBy}</span>}</div>
                <p className="text-xs text-slate-600 mt-2 italic">&quot;{mov.reason}&quot;</p>{mov.rejectionReason && <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Rejection: {mov.rejectionReason}</p>}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0"><button onClick={() => setSelectedMov(mov)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5"><Eye size={13} /> View</button><ProtectedAction permission="APPROVE_MOVEMENT">{mov.status === 'Pending' && <><button onClick={() => handleApprove(mov.id)} className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-1.5"><CheckCircle2 size={13} /> Approve</button><button onClick={() => { setSelectedMov(mov); setShowRejectInput(true); }} className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium flex items-center gap-1.5"><XCircle size={13} /> Reject</button></>}</ProtectedAction></div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200"><Truck size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No movement requests found.</p></div>}
      </div>

      {showCreate && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"><div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between"><h3 className="font-bold text-lg">Create Movement Request</h3><button onClick={() => setShowCreate(false)} className="p-2 rounded-full hover:bg-slate-200"><X size={18} /></button></div><div className="p-6 space-y-4 text-sm"><div><label className="text-xs font-semibold text-slate-500 uppercase">AC Unit</label><input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="e.g. AC-127" /></div><div><label className="text-xs font-semibold text-slate-500 uppercase">From Location</label><input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Block / Floor / Room" /></div><div><label className="text-xs font-semibold text-slate-500 uppercase">To Location</label><input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="Block / Floor / Room" /></div><div><label className="text-xs font-semibold text-slate-500 uppercase">Reason</label><textarea className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2" rows={3} placeholder="Explain why this AC needs to be moved..." /></div></div><div className="p-5 border-t border-slate-100 flex justify-end gap-3"><button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Cancel</button><button onClick={() => { alert('Movement request submitted for approval! (Mock)'); setShowCreate(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"><Plus size={14} /> Submit Request</button></div></motion.div></div>}

      {showRejectInput && selectedMov && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"><div className="p-5 bg-red-50 border-b border-red-100"><h3 className="font-bold text-lg text-red-800">Reject Request {selectedMov.id}</h3></div><div className="p-6"><label className="text-xs font-semibold text-slate-500 uppercase">Rejection Reason (required)</label><textarea className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain why this request is being rejected..." /></div><div className="p-5 border-t border-slate-100 flex justify-end gap-3"><button onClick={() => { setShowRejectInput(false); setRejectReason(''); }} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Cancel</button><button onClick={() => handleReject(selectedMov.id)} disabled={!rejectReason} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"><XCircle size={14} /> Confirm Rejection</button></div></motion.div></div>}
    </div>
  );
}
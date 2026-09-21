'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockMovementRequests, MovementRequest } from '@/lib/mock-data';
import { MoveRight, Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Approved: 'bg-blue-100 text-blue-700 border-blue-200',
  Rejected: 'bg-red-100 text-red-700 border-red-200',
  Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function TechnicianMovementsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MovementRequest[]>(mockMovementRequests);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Movement Requests</h1>
          <p className="text-sm text-slate-500">Submit AC relocation requests for FM approval.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={14} /> New Request
        </button>
      </div>

      <div className="space-y-3">
        {requests.map((mov, i) => (
          <motion.div
            key={mov.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
          >
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="font-mono text-sm font-bold text-blue-700">{mov.id}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[mov.status]}`}>{mov.status}</span>
              <span className="text-xs text-slate-400">• {mov.acId}</span>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap mb-2">
              <div className="bg-slate-100 rounded-lg px-2.5 py-1.5 flex-1 min-w-[100px]">
                <p className="text-slate-400 text-[10px] uppercase font-semibold">From</p>
                <p className="font-medium text-slate-700">{mov.fromLocation}</p>
              </div>
              <MoveRight size={16} className="text-blue-400 flex-shrink-0" />
              <div className="bg-blue-50 rounded-lg px-2.5 py-1.5 flex-1 min-w-[100px]">
                <p className="text-blue-400 text-[10px] uppercase font-semibold">To</p>
                <p className="font-medium text-slate-700">{mov.toLocation}</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-2 italic">"{mov.reason}"</p>
            <p className="text-xs text-slate-400 mt-1">📅 {mov.requestDate}</p>
            {mov.rejectionReason && <p className="text-xs text-red-600 mt-1 font-medium">⚠️ {mov.rejectionReason}</p>}
          </motion.div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold">Create Movement Request</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-full hover:bg-slate-200"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div><label className="text-xs font-semibold text-slate-500 uppercase">AC Unit ID</label><input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="AC-127" /></div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase">Current Location</label><input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Block / Floor / Room" /></div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase">Target Location</label><input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Block / Floor / Room" /></div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase">Reason</label><textarea className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" rows={2} placeholder="Why is this relocation needed?" /></div>
              <p className="text-xs text-slate-400">This request will be sent to the Facility Manager for approval.</p>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={() => { alert('Request submitted! Awaiting FM approval. (Mock)'); setShowCreate(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Submit</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

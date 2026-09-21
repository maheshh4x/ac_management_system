'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockMaintenanceJobs } from '@/lib/mock-data';
import { Wrench, CheckCircle2, Clock, AlertOctagon, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  Critical: <AlertOctagon size={14} className="text-red-500" />,
  High: <AlertOctagon size={14} className="text-orange-500" />,
  Medium: <Clock size={14} className="text-blue-500" />,
  Low: <Clock size={14} className="text-slate-400" />,
};

export default function TechnicianJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState(
    // Filter for current technician's jobs in a real app - here shows all
    mockMaintenanceJobs.filter(j => j.status !== 'Cancelled')
  );
  const [filter, setFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Completed'>('All');

  const filtered = filter === 'All' ? jobs : jobs.filter(j => j.status === filter);

  const updateStatus = (id: string, status: 'In Progress' | 'Completed') => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status, ...(status === 'Completed' ? { completedDate: new Date().toLocaleDateString() } : {}) } : j));
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Jobs</h1>
        <p className="text-sm text-slate-500">Jobs assigned to {user?.name || 'you'}.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', count: jobs.filter(j => j.status === 'Pending').length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'In Progress', count: jobs.filter(j => j.status === 'In Progress').length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', count: jobs.filter(j => j.status === 'Completed').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(item => (
          <div key={item.label} className={`rounded-xl p-3 ${item.bg} text-center`}>
            <p className={`text-xl font-bold ${item.color}`}>{item.count}</p>
            <p className="text-xs text-slate-500 font-medium">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['All', 'Pending', 'In Progress', 'Completed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${filter === tab ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Job Cards */}
      <div className="space-y-3">
        {filtered.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-bold text-blue-700">{job.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[job.status] || ''}`}>{job.status}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                {PRIORITY_ICONS[job.priority]} {job.priority}
              </div>
            </div>

            <p className="text-sm font-medium text-slate-800 mb-2">{job.description}</p>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mb-3">
              <span>🔧 <strong className="text-slate-700">{job.acId}</strong></span>
              <span>📍 {job.acLocation}</span>
              <span>📅 {job.scheduledDate}</span>
              <span>🔩 {job.type}</span>
            </div>

            {job.notes && (
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs text-slate-600 mb-3">
                <strong>Note:</strong> {job.notes}
              </div>
            )}

            <div className="flex gap-2">
              {job.status === 'Pending' && (
                <button onClick={() => updateStatus(job.id, 'In Progress')} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Start Job
                </button>
              )}
              {job.status === 'In Progress' && (
                <button onClick={() => updateStatus(job.id, 'Completed')} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={14} /> Mark Complete
                </button>
              )}
              {job.status === 'Completed' && (
                <div className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={14} /> Done {job.completedDate && `• ${job.completedDate}`}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
            <Wrench size={32} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium text-sm">No jobs in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

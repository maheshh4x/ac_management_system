'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockMaintenanceJobs, MaintenanceJob } from '@/lib/mock-data';
import { Wrench, Search, Plus, Filter, CheckCircle2, Clock, AlertOctagon, XCircle, Eye, X, ChevronDown } from 'lucide-react';
import { ProtectedAction } from '@/components/auth/ProtectedRoute';
import { MaintenanceMovementShell } from '@/components/features/MaintenanceMovementShell';
import { MovementPanel } from '@/components/features/MovementPanel';

import { useMaintenanceJobs } from '@/lib/maintenance-data-service';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-500',
  Medium: 'bg-blue-100 text-blue-600',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
};

export default function MaintenancePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedJob, setSelectedJob] = useState<MaintenanceJob | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [newAcId, setNewAcId] = useState('AC-127');
  const [newType, setNewType] = useState<MaintenanceJob['type']>('Preventive');
  const [newPriority, setNewPriority] = useState<MaintenanceJob['priority']>('Medium');
  const [newAssignee, setNewAssignee] = useState('Mr. Suresh Babu');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDesc, setNewDesc] = useState('');

  const { jobs, stats, updateJob, addJob } = useMaintenanceJobs({ search, status: statusFilter });

  const handleUpdateStatus = (id: string, status: MaintenanceJob['status']) => {
    const completedDate = status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined;
    updateJob(id, { status, ...(completedDate ? { completedDate } : {}) });
    if (selectedJob?.id === id) {
      setSelectedJob(prev => prev ? { ...prev, status, ...(completedDate ? { completedDate } : {}) } : null);
    }
  };

  const handleScheduleSubmit = () => {
    if (!newDesc.trim()) return;
    addJob({
      acId: newAcId,
      acLocation: 'Academic Block A - Room 102',
      type: newType,
      priority: newPriority,
      assignedTo: newAssignee,
      scheduledDate: newDate,
      description: newDesc,
      status: 'Pending',
      reportedBy: 'Facility Admin'
    });
    setNewDesc('');
    setShowAdd(false);
  };

  return (
    <MaintenanceMovementShell movement={<MovementPanel />} maintenance={
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track, assign & complete maintenance jobs for all AC units.</p>
        </div>
        <ProtectedAction permission="MANAGE_MAINTENANCE">
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
            <Plus size={16} /> Schedule Job
          </button>
        </ProtectedAction>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'In Progress', count: stats.inProgress, icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Completed', count: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-xl border p-4 flex items-center gap-4 ${item.bg}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm ${item.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search job ID, AC ID, technician..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards */}
      <div className="grid gap-4">
        {jobs.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="font-mono text-sm font-bold text-blue-700">{job.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[job.status]}`}>{job.status}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[job.priority]}`}>{job.priority}</span>
                <span className="text-xs text-slate-400">• {job.type}</span>
              </div>
              <p className="font-medium text-slate-800 text-sm mb-1">{job.description}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                <span>🔧 <strong>{job.acId}</strong></span>
                <span>📍 {job.acLocation}</span>
                <span>👷 {job.assignedTo}</span>
                <span>📅 {job.scheduledDate}</span>
              </div>
            </div>
            <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
              <button onClick={() => setSelectedJob(job)} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer">
                <Eye size={13} /> View
              </button>
              <ProtectedAction permission="MANAGE_MAINTENANCE">
                {job.status === 'Pending' && (
                  <button onClick={() => handleUpdateStatus(job.id, 'In Progress')} className="px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium transition-colors cursor-pointer">
                    Start Job
                  </button>
                )}
                {job.status === 'In Progress' && (
                  <button onClick={() => handleUpdateStatus(job.id, 'Completed')} className="px-3 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-medium transition-colors cursor-pointer">
                    Complete
                  </button>
                )}
              </ProtectedAction>
            </div>
          </motion.div>
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            <Wrench size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No maintenance jobs found.</p>
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{selectedJob.id} – {selectedJob.type}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${STATUS_COLORS[selectedJob.status]}`}>{selectedJob.status}</span>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-2 rounded-full hover:bg-slate-200 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <p className="text-slate-700">{selectedJob.description}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['AC Unit', selectedJob.acId], ['Location', selectedJob.acLocation],
                  ['Priority', selectedJob.priority], ['Assigned To', selectedJob.assignedTo],
                  ['Reported By', selectedJob.reportedBy], ['Scheduled', selectedJob.scheduledDate],
                  ...(selectedJob.completedDate ? [['Completed', selectedJob.completedDate]] : []),
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">{k}</p>
                    <p className="font-medium text-slate-800 mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
              {selectedJob.notes && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide mb-1">Notes</p>
                  <p className="text-slate-700">{selectedJob.notes}</p>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setSelectedJob(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-pointer">Close</button>
              <ProtectedAction permission="MANAGE_MAINTENANCE">
                {selectedJob.status === 'Pending' && <button onClick={() => handleUpdateStatus(selectedJob.id, 'In Progress')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer">Start Job</button>}
                {selectedJob.status === 'In Progress' && <button onClick={() => handleUpdateStatus(selectedJob.id, 'Completed')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 cursor-pointer">Mark Complete</button>}
              </ProtectedAction>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Job Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg">Schedule Maintenance Job</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-full hover:bg-slate-200 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">AC Unit</label>
                  <input value={newAcId} onChange={e => setNewAcId(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="AC-127" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Job Type</label>
                  <select value={newType} onChange={e => setNewType(e.target.value as any)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="Preventive">Preventive</option>
                    <option value="Repair">Repair</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Inspection">Inspection</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Priority</label>
                  <select value={newPriority} onChange={e => setNewPriority(e.target.value as any)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Assign To</label>
                  <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="Mr. Suresh Babu">Mr. Suresh Babu</option>
                    <option value="Mr. Karthik Rajan">Mr. Karthik Rajan</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Scheduled Date</label>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                  <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" rows={2} placeholder="Describe the maintenance task..." />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-pointer">Cancel</button>
              <button onClick={handleScheduleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer"><Plus size={14} /> Schedule Job</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    } />
  );
}

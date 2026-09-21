'use client';

import React, { useState } from 'react';
// import { motion } from 'framer-motion';
import { Plus, RefreshCw } from 'lucide-react';
import { ProtectedAction } from '@/components/auth/ProtectedRoute';
import { useACDataset } from '@/hooks/useACDataset';
import { ACStatCards } from '@/components/features/ACStatCards';
import { ACTable } from '@/components/features/ACTable';
import { ACFilterBar } from '@/components/features/ACFilterBar';

export default function AssetsPage() {
  const [filters, setFilters] = useState<{ search?: string; status?: string; buildingId?: string }>({});
  const { acs, stats, loading, error, refreshData } = useACDataset(filters);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AC Asset Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage, monitor, and update all AC units across campus in real time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refreshData()}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <RefreshCw size={14} /> Refresh Data
          </button>
          <ProtectedAction permission="CREATE_AC">
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all">
              <Plus size={16} /> Add AC Unit
            </button>
          </ProtectedAction>
        </div>
      </div>

      {/* Real-time Status Summary Cards with Gradient design */}
      <ACStatCards 
        stats={stats} 
        loading={loading} 
        error={error} 
        onStatClick={(status) => setFilters(prev => ({ ...prev, status: status === 'All' ? undefined : status }))} 
      />

      {/* Filter Bar */}
      <ACFilterBar filters={filters} onChange={setFilters} />

      {/* Reactive Asset Table */}
      <ACTable 
        acList={acs} 
        loading={loading} 
      />
    </div>
  );
}

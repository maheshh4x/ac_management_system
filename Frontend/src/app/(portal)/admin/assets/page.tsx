'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useACDataset } from '@/hooks/useACDataset';
import { DataSourceIndicator } from '@/components/ui/DataSourceIndicator';
import { ACFilterBar } from '@/components/features/ACFilterBar';
import { ACTable } from '@/components/features/ACTable';
import { ImportACModal } from '@/components/features/csv-import/ImportACModal';
import { ProtectedAction } from '@/components/auth/ProtectedRoute';
import { Upload, Plus, Airplay } from 'lucide-react';
import { ACFilters, ExtendedAC } from '@/lib/ac-data-service';

export default function AssetsPage() {
  const [filters, setFilters] = useState<ACFilters>({
    search: '',
    buildingId: 'All',
    acType: 'All',
    status: 'All'
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const {
    acs,
    stats,
    dataSource,
    loading,
    error,
    importACAssets,
    replaceDemoACAssets,
    resetToDemoData
  } = useACDataset(filters);

  const handleExecuteImport = async (newACs: ExtendedAC[], mode: 'add' | 'replace') => {
    if (mode === 'replace') {
      return await replaceDemoACAssets(newACs);
    } else {
      return await importACAssets(newACs);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AC Asset Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage, filter, and import college AC units across campus blocks.</p>
        </div>

        <ProtectedAction permission="CREATE_AC">
          <div className="flex gap-2">
            <button 
              onClick={() => setShowImportModal(true)} 
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              <Upload size={15} /> Import Real College Data
            </button>
          </div>
        </ProtectedAction>
      </div>

      {/* Data Source Indicator */}
      <DataSourceIndicator
        dataSource={dataSource}
        onResetDemo={resetToDemoData}
      />

      {/* Status Summary Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total ACs', count: stats.total, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Working', count: stats.working, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Faulty', count: stats.faulty, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
          { label: 'Under Maintenance', count: stats.underMaintenance, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
        ].map(item => (
          <div key={item.label} className={`rounded-xl border p-4 ${item.bg}`}>
            <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <ACFilterBar
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters({ search: '', buildingId: 'All', acType: 'All', status: 'All' })}
      />

      {/* Assets Table */}
      <ACTable
        acList={acs}
        loading={loading}
      />

      {/* CSV Import Modal */}
      <ImportACModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        existingACs={acs}
        onImportSuccess={handleExecuteImport}
      />
    </div>
  );
}

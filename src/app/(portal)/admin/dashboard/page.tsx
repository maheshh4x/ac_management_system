'use client';

import React, { useState } from 'react';
import { useACDataset } from '@/hooks/useACDataset';
import { DataSourceIndicator } from '@/components/ui/DataSourceIndicator';
import { ACStatCards } from '@/components/features/ACStatCards';
import { ACFilterBar } from '@/components/features/ACFilterBar';
import { ACStatusChart } from '@/components/features/charts/ACStatusChart';
import { ACTypeChart } from '@/components/features/charts/ACTypeChart';
import { BuildingDistributionChart } from '@/components/features/charts/BuildingDistributionChart';
import { ACCapacityChart } from '@/components/features/charts/ACCapacityChart';
import { MaintenanceTrendChart } from '@/components/features/charts/MaintenanceTrendChart';
import { ImportACModal } from '@/components/features/csv-import/ImportACModal';
import { ACTable } from '@/components/features/ACTable';
import { ProtectedAction } from '@/components/auth/ProtectedRoute';
import { Upload } from 'lucide-react';
import { ACFilters } from '@/lib/ac-data-service';

export default function AdminDashboardPage() {
  const [filters, setFilters] = useState<ACFilters>({
    search: '',
    buildingId: 'All',
    acType: 'All',
    status: 'All'
  });

  const [showImportModal, setShowImportModal] = useState(false);

  const {
    acs,
    stats,
    dataSource,
    loading,
    error,
    refreshData,
    importACAssets,
    replaceDemoACAssets,
    resetToDemoData,
    statusDistribution,
    typeDistribution,
    buildingDistribution,
    capacityDistribution
  } = useACDataset(filters);

  const handleExecuteImport = async (newACs: any[], mode: 'add' | 'replace') => {
    if (mode === 'replace') {
      return await replaceDemoACAssets(newACs);
    } else {
      return await importACAssets(newACs);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      buildingId: 'All',
      acType: 'All',
      status: 'All'
    });
  };

  const handleStatClick = (statusFilter: string) => {
    setFilters(prev => ({
      ...prev,
      status: statusFilter === prev.status ? 'All' : statusFilter
    }));
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            NITTTR AC Asset Management Command Center
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time monitoring, maintenance tracking, and asset analytics across campus.
          </p>
        </div>

        <ProtectedAction permission="CREATE_AC">
          <div className="flex items-center gap-3">
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

      {/* KPI Stat Cards */}
      <ACStatCards
        stats={stats}
        loading={loading}
        error={error}
        onStatClick={handleStatClick}
      />

      {/* Filter Bar */}
      <ACFilterBar
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Interactive Charts Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Status Breakdown Donut Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">AC Operational Status</h3>
              <p className="text-xs text-slate-500">Live health breakdown</p>
            </div>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Real-time</span>
          </div>
          <ACStatusChart data={statusDistribution} loading={loading} error={error} onRetry={refreshData} />
        </div>

        {/* Type Breakdown Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">AC Type Distribution</h3>
              <p className="text-xs text-slate-500">Split, Window, Cassette, Tower</p>
            </div>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Units</span>
          </div>
          <ACTypeChart data={typeDistribution} loading={loading} error={error} onRetry={refreshData} />
        </div>

        {/* Building Distribution Horizontal Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Building-wise AC Distribution</h3>
              <p className="text-xs text-slate-500">Units deployed per building</p>
            </div>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Campus</span>
          </div>
          <BuildingDistributionChart data={buildingDistribution} loading={loading} error={error} onRetry={refreshData} />
        </div>

        {/* Capacity Breakdown Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">AC Capacity Breakdown (Tons)</h3>
              <p className="text-xs text-slate-500">Tonnage distribution across units</p>
            </div>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Cooling</span>
          </div>
          <ACCapacityChart data={capacityDistribution} loading={loading} error={error} onRetry={refreshData} />
        </div>

        {/* Maintenance Trend Line Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Maintenance Jobs Trend</h3>
              <p className="text-xs text-slate-500">Monthly breakdown of scheduled vs completed jobs</p>
            </div>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Monthly</span>
          </div>
          <MaintenanceTrendChart loading={loading} error={error} onRetry={refreshData} />
        </div>
      </div>

      {/* Filtered AC Assets Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-slate-900">Active AC Asset Records</h2>
          <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
            Displaying <strong className="text-slate-900">{acs.length}</strong> filtered units
          </span>
        </div>
        <ACTable acList={acs} loading={loading} />
      </div>

      {/* CSV/Excel Import Modal */}
      <ImportACModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        existingACs={acs}
        onImportSuccess={handleExecuteImport}
      />
    </div>
  );
}

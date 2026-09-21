'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockACs } from '@/lib/mock-campus-database';
import { FileText, Download, BarChart3, PieChart, Filter } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';

const allACs = [
  ...mockACs,
  { id: 'AC-130', make: 'Voltas', model: 'VW183PC', capacity: '1.5 Ton', serialNumber: 'VLT98765', type: 'Window', manufacturingYear: '2020', installationYear: '2021', starRating: '3', powerRating: '1.6 kW', powerFactor: '0.90', status: 'Offline', lastMaintenanceType: 'Repair', lastMaintenanceDate: '15-Jul-2025', location: { buildingId: 'BLK-004', floorId: 'BLK-004-FLR-0', departmentId: 'DEPT-003', roomId: 'ROOM-010' } },
  { id: 'AC-131', make: 'Blue Star', model: 'IC518DATU', capacity: '1.5 Ton', serialNumber: 'BS112233', type: 'Split', manufacturingYear: '2023', installationYear: '2023', starRating: '5', powerRating: '1.45 kW', powerFactor: '0.95', status: 'Working', lastMaintenanceType: 'Preventive', lastMaintenanceDate: '01-Sep-2026', location: { buildingId: 'BLK-003', floorId: 'BLK-003-FLR-2', departmentId: 'DEPT-002', roomId: 'ROOM-004' } },
  { id: 'AC-132', make: 'Daikin', model: 'ATKL50', capacity: '2.0 Ton', serialNumber: 'DAI990011', type: 'Cassette', manufacturingYear: '2022', installationYear: '2022', starRating: '4', powerRating: '1.95 kW', powerFactor: '0.92', status: 'Fault', lastMaintenanceType: 'Emergency', lastMaintenanceDate: '10-Sep-2026', location: { buildingId: 'BLK-006', floorId: 'BLK-006-FLR-0', departmentId: 'DEPT-005', roomId: 'ROOM-007' } },
];

const COLORS = ['#16a34a', '#ef4444', '#f59e0b', '#94a3b8'];
const STATUS_ORDER = ['Working', 'Fault', 'Maintenance', 'Offline'];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<'status' | 'type' | 'building' | 'maintenance'>('status');

  const statusData = STATUS_ORDER.map(s => ({ name: s, value: allACs.filter(a => a.status === s).length }));
  const typeData = Object.entries(allACs.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }));
  const buildingData = Object.entries(allACs.reduce((acc, a) => { acc[a.location.buildingId] = (acc[a.location.buildingId] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }));
  const maintenanceData = [
    { month: 'Jul', Preventive: 3, Repair: 1, Emergency: 0 },
    { month: 'Aug', Preventive: 4, Repair: 2, Emergency: 1 },
    { month: 'Sep', Preventive: 2, Repair: 3, Emergency: 1 },
  ];

  const reportTabs = [
    { id: 'status', label: 'Status Overview' },
    { id: 'type', label: 'AC Types' },
    { id: 'building', label: 'By Building' },
    { id: 'maintenance', label: 'Maintenance Trend' },
  ] as const;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Visual insights into AC asset utilization and maintenance trends.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
            <Download size={16} /> Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Asset Value', value: '₹24.8L', sub: 'estimated', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Operational Rate', value: '71%', sub: 'working/total', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Avg. AC Age', value: '2.4 yrs', sub: 'across all units', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
          { label: 'MTD Maintenance', value: '6 jobs', sub: 'Sep 2026', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
        ].map(item => (
          <div key={item.label} className={`rounded-xl border p-4 ${item.bg}`}>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs font-semibold text-slate-700 mt-1">{item.label}</p>
            <p className="text-xs text-slate-400">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Report Tab Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 bg-slate-100 p-1 rounded-xl w-fit">
        {reportTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeReport === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <motion.div
        key={activeReport}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
      >
        {activeReport === 'status' && (
          <>
            <h3 className="text-base font-semibold mb-6">AC Unit Status Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={4} dataKey="value" label={({ name, percent = 0 }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusData.map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeReport === 'type' && (
          <>
            <h3 className="text-base font-semibold mb-6">AC Units by Type</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]}>
                    {typeData.map((_, i) => <Cell key={i} fill={['#2563EB', '#7C3AED', '#059669', '#D97706'][i % 4]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeReport === 'building' && (
          <>
            <h3 className="text-base font-semibold mb-6">ACs per Building</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildingData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={65} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]}>
                    {buildingData.map((_, i) => <Cell key={i} fill={`hsl(${210 + i * 20}, 72%, ${55 - i * 2}%)`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeReport === 'maintenance' && (
          <>
            <h3 className="text-base font-semibold mb-6">Maintenance Jobs – Monthly Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Bar dataKey="Preventive" fill="#2563EB" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="Repair" fill="#F59E0B" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="Emergency" fill="#EF4444" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </motion.div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Raw Asset Data Table</h3>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors"><Download size={12} /> CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['AC ID', 'Make', 'Type', 'Capacity', 'Status', 'Block', 'Last Service'].map(h => (
                  <th key={h} className="text-left font-semibold text-slate-500 px-4 py-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allACs.map(ac => (
                <tr key={ac.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 font-mono font-semibold text-blue-700">{ac.id}</td>
                  <td className="px-4 py-2.5 text-slate-700">{ac.make} {ac.model}</td>
                  <td className="px-4 py-2.5 text-slate-600">{ac.type}</td>
                  <td className="px-4 py-2.5 text-slate-600">{ac.capacity}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold border ${{'Working':'bg-emerald-100 text-emerald-700 border-emerald-200','Fault':'bg-red-100 text-red-700 border-red-200','Maintenance':'bg-amber-100 text-amber-700 border-amber-200','Offline':'bg-slate-100 text-slate-500 border-slate-200'}[ac.status] || ''}`}>
                      {ac.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{ac.location.buildingId}</td>
                  <td className="px-4 py-2.5 text-slate-500">{ac.lastMaintenanceDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

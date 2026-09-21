'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockACs } from '@/lib/mock-campus-database';
import { mockBuildings } from '@/lib/mock-campus-database';
import { Search, Airplay, Building2, MapPin, Filter, Eye } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  Working: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Fault: 'bg-red-100 text-red-700 border-red-200',
  Maintenance: 'bg-amber-100 text-amber-700 border-amber-200',
  Offline: 'bg-slate-100 text-slate-500 border-slate-200',
};

const allACs = [
  ...mockACs,
  { id: 'AC-130', make: 'Voltas', model: 'VW183PC', capacity: '1.5 Ton', serialNumber: 'VLT98765', type: 'Window', manufacturingYear: '2020', installationYear: '2021', starRating: '3', powerRating: '1.6 kW', powerFactor: '0.90', status: 'Offline', lastMaintenanceType: 'Repair', lastMaintenanceDate: '15-Jul-2025', location: { buildingId: 'BLK-004', floorId: 'BLK-004-FLR-0', departmentId: 'DEPT-003', roomId: 'ROOM-010' } },
  { id: 'AC-131', make: 'Blue Star', model: 'IC518DATU', capacity: '1.5 Ton', serialNumber: 'BS112233', type: 'Split', manufacturingYear: '2023', installationYear: '2023', starRating: '5', powerRating: '1.45 kW', powerFactor: '0.95', status: 'Working', lastMaintenanceType: 'Preventive', lastMaintenanceDate: '01-Sep-2026', location: { buildingId: 'BLK-003', floorId: 'BLK-003-FLR-2', departmentId: 'DEPT-002', roomId: 'ROOM-004' } },
];

export default function ViewerSearchPage() {
  const [search, setSearch] = useState('');
  const [searchType, setSearchType] = useState<'ac' | 'location'>('ac');
  const [statusFilter, setStatusFilter] = useState('All');

  const matchedACs = allACs.filter(ac => {
    const q = search.toLowerCase();
    const matchSearch = q === '' || [ac.id, ac.make, ac.model, ac.serialNumber, ac.location.buildingId, ac.location.roomId].join(' ').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || ac.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const matchedBuildings = mockBuildings.filter(b => {
    const q = search.toLowerCase();
    return q === '' || [b.id, b.name, b.type].join(' ').toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AC & Location Search</h1>
        <p className="text-sm text-slate-500 mt-1">Search for AC units by ID/make, or explore campus locations.</p>
      </div>

      {/* Search mode tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 w-fit gap-1">
        <button onClick={() => setSearchType('ac')} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${searchType === 'ac' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          🔧 AC Units
        </button>
        <button onClick={() => setSearchType('location')} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${searchType === 'location' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          🏛️ Locations
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={searchType === 'ac' ? "Search by AC ID, make, model, serial..." : "Search by block name, type..."}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {searchType === 'ac' && (
          <div className="flex gap-2">
            {['All', 'Working', 'Fault', 'Maintenance', 'Offline'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {searchType === 'ac' ? (
        <div className="grid gap-3">
          {matchedACs.map((ac, i) => (
            <motion.div key={ac.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-200">
                <Airplay size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{ac.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[ac.status] || STATUS_COLORS['Offline']}`}>{ac.status}</span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{ac.make} {ac.model} • {ac.type} • {ac.capacity}</p>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                  <MapPin size={11} /> {ac.location.buildingId} → {ac.location.floorId.split('-').pop()} → {ac.location.roomId}
                </div>
                <p className="text-xs text-slate-400 mt-1">SN: {ac.serialNumber} • Last service: {ac.lastMaintenanceDate}</p>
              </div>
              <Link href="/campus" className="flex-shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                <Eye size={12} /> Map
              </Link>
            </motion.div>
          ))}
          {matchedACs.length === 0 && (
            <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
              <Airplay size={32} className="mx-auto mb-2 opacity-30" />
              <p className="font-medium text-sm">No AC units match your search.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {matchedBuildings.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-200">
                <Building2 size={18} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{b.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{b.id} • {b.type}</p>
                <p className="text-xs text-slate-400 mt-1">ACs installed: {allACs.filter(ac => ac.location.buildingId === b.id).length}</p>
              </div>
              <Link href="/campus" className="flex-shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                <Eye size={12} /> Map
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

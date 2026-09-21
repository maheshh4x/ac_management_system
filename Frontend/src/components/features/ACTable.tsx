// src/components/features/ACTable.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, AlertOctagon, Wrench, PowerOff, Eye, Edit3, Trash2, MapPin, 
  ChevronLeft, ChevronRight, ArrowUpDown, ShieldCheck, Airplay, X, AlertTriangle
} from 'lucide-react';
import { ExtendedAC } from '@/lib/ac-data-service';
import { ProtectedAction } from '@/components/auth/ProtectedRoute';
import Link from 'next/link';

interface ACTableProps {
  acList: ExtendedAC[];
  loading?: boolean;
  onEdit?: (ac: ExtendedAC) => void;
  onDeactivate?: (ac: ExtendedAC) => void;
}

const STATUS_BADGES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Working: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'Working',
    icon: <CheckCircle2 size={12} className="inline mr-1" />
  },
  Fault: {
    bg: 'bg-red-50 text-red-700 border-red-200',
    text: 'Faulty',
    icon: <AlertOctagon size={12} className="inline mr-1" />
  },
  Maintenance: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    text: 'Maintenance',
    icon: <Wrench size={12} className="inline mr-1" />
  },
  Offline: {
    bg: 'bg-slate-50 text-slate-600 border-slate-200',
    text: 'Offline',
    icon: <PowerOff size={12} className="inline mr-1" />
  }
};

type SortField = 'id' | 'make' | 'type' | 'capacity' | 'status' | 'buildingName' | 'lastMaintenanceDate';

export const ACTable: React.FC<ACTableProps> = ({
  acList,
  loading = false,
  onEdit,
  onDeactivate
}) => {
  const [selectedAC, setSelectedAC] = useState<ExtendedAC | null>(null);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedList = useMemo(() => {
    return [...acList].sort((a, b) => {
      let valA: string = (a[sortField] || a.location.buildingId || '') as string;
      let valB: string = (b[sortField] || b.location.buildingId || '') as string;
      if (sortField === 'buildingName') {
        valA = a.buildingName || a.location.buildingId;
        valB = b.buildingName || b.location.buildingId;
      }
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [acList, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedList.slice(start, start + pageSize);
  }, [sortedList, page, pageSize]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-2xs text-center animate-pulse space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded mx-auto" />
        <div className="h-4 w-64 bg-slate-100 rounded mx-auto" />
        <div className="h-64 bg-slate-50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th 
                className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1">
                  AC ID <ArrowUpDown size={12} className="text-slate-400" />
                </div>
              </th>
              <th 
                className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('make')}
              >
                <div className="flex items-center gap-1">
                  Make / Model <ArrowUpDown size={12} className="text-slate-400" />
                </div>
              </th>
              <th 
                className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-1">
                  Type <ArrowUpDown size={12} className="text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-3.5">Capacity</th>
              <th 
                className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status <ArrowUpDown size={12} className="text-slate-400" />
                </div>
              </th>
              <th 
                className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('buildingName')}
              >
                <div className="flex items-center gap-1">
                  Location (Building / Room) <ArrowUpDown size={12} className="text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-3.5">Last Maintenance</th>
              <th className="px-4 py-3.5">Next Service</th>
              <th className="px-4 py-3.5">Data Tag</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
            {paginatedList.map((ac, idx) => {
              const statusBadge = STATUS_BADGES[ac.status] || STATUS_BADGES.Offline;
              return (
                <motion.tr
                  key={ac.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-4 py-3.5 font-mono font-semibold whitespace-nowrap">
                    <button
                      onClick={() => setSelectedAC(ac)}
                      className="text-blue-700 hover:text-blue-900 hover:underline text-left cursor-pointer transition-colors"
                      title={`Click to view all details for ${ac.id}`}
                    >
                      {ac.id}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-900">{ac.make} {ac.model}</div>
                    <div className="text-[11px] text-slate-400 font-mono">SN: {ac.serialNumber || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                    {ac.type}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                    {ac.capacity}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg}`}>
                      {statusBadge.icon} {statusBadge.text}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <div className="text-slate-800 font-medium truncate">
                      {ac.buildingName || ac.location.buildingId}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 truncate">
                      <MapPin size={11} className="text-slate-400 shrink-0" />
                      {ac.roomName || ac.location.roomId || 'General Room'}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                    <div>{ac.lastMaintenanceDate || 'Not Recorded'}</div>
                    <div className="text-slate-400 text-[11px]">{ac.lastMaintenanceType || 'Routine'}</div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                    <div>{ac.nextMaintenanceDate || 'Scheduled'}</div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {ac.isDemo ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Demo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck size={10} /> Official
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setSelectedAC(ac)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        title="View Asset Details"
                      >
                        <Eye size={15} />
                      </button>
                      {onEdit && (
                        <ProtectedAction permission="EDIT_AC">
                          <button
                            onClick={() => onEdit(ac)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Edit Record"
                          >
                            <Edit3 size={15} />
                          </button>
                        </ProtectedAction>
                      )}
                      {onDeactivate && (
                        <ProtectedAction permission="DEACTIVATE_AC">
                          <button
                            onClick={() => onDeactivate(ac)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            title="Deactivate"
                          >
                            <Trash2 size={15} />
                          </button>
                        </ProtectedAction>
                      )}
                      <Link
                        href={`/campus?acId=${ac.id}`}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                        title="View on 3D Campus Map"
                      >
                        <MapPin size={15} />
                      </Link>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedList.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Airplay size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-600 text-base">No AC assets match your filters.</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting your search query or building filters.</p>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 border border-slate-200 rounded-md bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
          <span>of <strong className="text-slate-900">{sortedList.length}</strong> total ACs</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            Page <strong className="text-slate-900">{page}</strong> of <strong>{totalPages}</strong>
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* AC Detail Modal */}
      <AnimatePresence>
        {selectedAC && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-900">{selectedAC.id}</h3>
                    {selectedAC.isDemo ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">Demo</span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">Official</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{selectedAC.make} {selectedAC.model}</p>
                </div>
                <button
                  onClick={() => setSelectedAC(null)}
                  className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4 text-xs">
                {[
                  ['Serial Number', selectedAC.serialNumber || 'N/A'],
                  ['AC Type', `${selectedAC.type} AC`],
                  ['Capacity', selectedAC.capacity],
                  ['Status', selectedAC.status],
                  ['Building', selectedAC.buildingName || selectedAC.location.buildingId],
                  ['Floor', selectedAC.floorName || selectedAC.location.floorId],
                  ['Room', selectedAC.roomName || selectedAC.location.roomId],
                  ['Department', selectedAC.departmentName || 'Engineering'],
                  ['Last Service Date', selectedAC.lastMaintenanceDate || 'N/A'],
                  ['Last Service Type', selectedAC.lastMaintenanceType || 'Routine'],
                  ['Assigned Tech', selectedAC.technician || 'Central Maintenance Team'],
                  ['Remarks', selectedAC.remarks || 'Standard asset']
                ].map(([label, val]) => (
                  <div key={label} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">{label}</span>
                    <span className="font-semibold text-slate-800">{val}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <Link
                  href={`/campus?acId=${selectedAC.id}`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <MapPin size={14} /> Locate on 3D Twin Map
                </Link>
                <button
                  onClick={() => setSelectedAC(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

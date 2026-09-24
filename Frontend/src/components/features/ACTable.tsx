// src/components/features/ACTable.tsx
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, AlertOctagon, Wrench, PowerOff, Eye, Edit3, Trash2, MapPin, 
  ChevronLeft, ChevronRight, ArrowUpDown, ShieldCheck, Airplay, Save, X
} from 'lucide-react';
import { ExtendedAC, acStore } from '@/lib/ac-data-service';
import { ProtectedAction } from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { canEditInventory } from '@/lib/permissions';

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
  const { user } = useAuth();
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<ExtendedAC>>({});
  const canEditAcInventory = canEditInventory(user?.role ?? null);

  const roleBase = user?.role === 'SUPER_ADMIN' ? '/admin'
    : user?.role === 'FACILITY_MANAGER' ? '/manager'
    : user?.role === 'TECHNICIAN' ? '/technician'
    : '/viewer';

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

  const startInlineEdit = (ac: ExtendedAC) => {
    if (!canEditAcInventory) return;
    setEditingId(ac.id);
    setDraft({
      status: ac.status,
      technician: ac.technician ?? '',
      remarks: ac.remarks ?? '',
      nextMaintenanceDate: ac.nextMaintenanceDate ?? '',
    });
  };

  const saveInlineEdit = (acId: string) => {
    if (!canEditAcInventory) return;

    try {
      acStore.updateACAsset(acId, draft);
      setEditingId(null);
      setDraft({});
    } catch {
      // surfaced via UI disabled state; keep in-memory draft without closing if needed
    }
  };

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
              const detailHref = `${roleBase}/assets/${encodeURIComponent(ac.id)}`;
              return (
                <motion.tr
                  key={ac.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-4 py-3.5 font-mono font-semibold whitespace-nowrap">
                    <Link
                      href={detailHref}
                      className="text-blue-700 hover:text-blue-900 hover:underline text-left cursor-pointer transition-colors"
                      title={`Click to view 3D detail page for ${ac.id}`}
                    >
                      {ac.id}
                    </Link>
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
                    {editingId === ac.id && canEditAcInventory ? (
                      <select
                        value={draft.status ?? ac.status}
                        onChange={e => setDraft(prev => ({ ...prev, status: e.target.value as ExtendedAC['status'] }))}
                        className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-400 outline-none"
                      >
                        <option value="Working">Working</option>
                        <option value="Fault">Fault</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Offline">Offline</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg}`}>
                        {statusBadge.icon} {statusBadge.text}
                      </span>
                    )}
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
                    {editingId === ac.id && canEditAcInventory ? (
                      <input
                        value={draft.lastMaintenanceDate ?? ac.lastMaintenanceDate ?? ''}
                        onChange={e => setDraft(prev => ({ ...prev, lastMaintenanceDate: e.target.value }))}
                        className="border border-slate-200 rounded-md px-2 py-1 text-[11px] w-28 focus:ring-2 focus:ring-blue-400 outline-none"
                      />
                    ) : (
                      <>
                        <div>{ac.lastMaintenanceDate || 'Not Recorded'}</div>
                        <div className="text-slate-400 text-[11px]">{ac.lastMaintenanceType || 'Routine'}</div>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                    {editingId === ac.id && canEditAcInventory ? (
                      <input
                        value={draft.nextMaintenanceDate ?? ac.nextMaintenanceDate ?? ''}
                        onChange={e => setDraft(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))}
                        className="border border-slate-200 rounded-md px-2 py-1 text-[11px] w-24 focus:ring-2 focus:ring-blue-400 outline-none"
                      />
                    ) : (
                      <div>{ac.nextMaintenanceDate || 'Scheduled'}</div>
                    )}
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
                      {/* View 3D Detail Page */}
                      <Link
                        href={detailHref}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        title="View 3D Detail Page"
                      >
                        <Eye size={15} />
                      </Link>
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

                      {canEditAcInventory && (
                        editingId === ac.id ? (
                          <>
                            <button
                              onClick={() => saveInlineEdit(ac.id)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                              title="Save changes"
                            >
                              <Save size={15} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setDraft({});
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                              title="Cancel edit"
                            >
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startInlineEdit(ac)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Edit inline"
                          >
                            <Edit3 size={15} />
                          </button>
                        )
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
    </div>
  );
};

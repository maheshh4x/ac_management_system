'use client';

import React, { ChangeEvent, DragEvent, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { acStore } from '@/lib/ac-data-service';
import { useCampusManagement } from '@/hooks/useCampusManagement';
import { Building, BuildingPhoto, BuildingStatus, Floor, Room } from '@/lib/types/campus';
import {
  Building2, Eye, Grid3X3, ImagePlus, Layers, Pencil,
  Plus, Trash2, Upload, X, MoreVertical, ArrowUp, ArrowDown,
} from 'lucide-react';

type CampusTab = 'buildings' | 'departments' | 'rooms';
type EditorMode = 'view' | 'edit';

interface BlockDraft extends Building {
  status: BuildingStatus;
  description: string;
  photos: BuildingPhoto[];
}

interface FormErrors {
  name?: string;
  id?: string;
  floors?: string;
}

const BLOCK_TYPES = ['Academic', 'Administrative', 'Library', 'Cultural', 'IT', 'R&D', 'Residential', 'Food & Beverages', 'Service', 'Sports'];
const STATUS_STYLES: Record<BuildingStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  'Under Maintenance': 'bg-amber-100 text-amber-700 border-amber-200',
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function sortFloors(floors: Floor[]) {
  return [...floors].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export default function CampusManagementPage() {
  const { data, isLoaded, updateData } = useCampusManagement();
  const [activeTab, setActiveTab] = useState<CampusTab>('buildings');
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [draft, setDraft] = useState<BlockDraft | null>(null);
  const [editingBuildingId, setEditingBuildingId] = useState<string | null>(null);
  const [draftFloors, setDraftFloors] = useState<Floor[]>([]);
  const [draftRooms, setDraftRooms] = useState<Room[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);
  const [lightbox, setLightbox] = useState<BuildingPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  const notify = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const openEditor = (building: Building | null, mode: EditorMode) => {
    const id = building?.id || '';
    const floors = building ? sortFloors(data.floors.filter(floor => floor.buildingId === id)) : [{ id: makeId('floor'), name: 'Ground Floor', buildingId: '', order: 0 }];
    setDraft(building ? { ...building, status: building.status || 'Active', description: building.description || '', photos: building.photos || [] } : { id: '', name: '', type: 'Academic', status: 'Active', description: '', photos: [] });
    setEditingBuildingId(building?.id || null);
    setDraftFloors(floors);
    setDraftRooms(building ? data.rooms.filter(room => floors.some(floor => floor.id === room.floorId)) : []);
    setErrors({});
    setEditorMode(mode);
    setShowAdd(!building);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (!saving) {
      setEditorOpen(false);
      setDraft(null);
      setEditingBuildingId(null);
      setLightbox(null);
    }
  };

  const updateFloorCount = (value: string) => {
    const count = Number(value);
    if (!Number.isInteger(count) || count < 1) {
      setErrors(prev => ({ ...prev, floors: 'Floors must be a positive integer.' }));
      return;
    }
    setErrors(prev => ({ ...prev, floors: undefined }));
    setDraftFloors(current => {
      if (count === current.length) return current;
      if (count < current.length) {
        const kept = current.slice(0, count);
        setDraftRooms(rooms => rooms.filter(room => kept.some(floor => floor.id === room.floorId)));
        return kept;
      }
      return [...current, ...Array.from({ length: count - current.length }, (_, index) => ({
        id: makeId('floor'), name: `Floor ${current.length + index}`, buildingId: draft?.id || '', order: current.length + index,
      }))];
    });
  };

  const moveFloor = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draftFloors.length) return;
    const next = [...draftFloors];
    [next[index], next[target]] = [next[target], next[index]];
    setDraftFloors(next.map((floor, order) => ({ ...floor, order })));
  };

  const addFloor = () => {
    setDraftFloors(current => [...current, { id: makeId('floor'), name: `Floor ${current.length}`, buildingId: draft?.id || '', order: current.length }]);
  };

  const deleteFloor = (floorId: string) => {
    const floor = draftFloors.find(item => item.id === floorId);
    const linkedAssets = acStore.getActiveACDataset().filter(ac => ac.location.floorId === floorId);
    if (linkedAssets.length) {
      notify('error', `${floor?.name || 'This floor'} cannot be deleted because ${linkedAssets.length} linked asset(s) still exist.`);
      return;
    }
    if (!floor || !window.confirm(`Delete ${floor.name} and its ${draftRooms.filter(room => room.floorId === floorId).length} room(s)?`)) return;
    setDraftFloors(current => current.filter(item => item.id !== floorId).map((item, order) => ({ ...item, order })));
    setDraftRooms(current => current.filter(room => room.floorId !== floorId));
  };

  const addRoom = (floorId: string) => {
    setDraftRooms(current => [...current, { id: makeId('room'), name: 'New Room', type: 'Classroom', floorId, order: current.filter(room => room.floorId === floorId).length }]);
  };

  const saveBlock = async () => {
    if (!draft) return;
    const nextErrors: FormErrors = {};
    const name = draft.name.trim();
    const id = draft.id.trim().toUpperCase();
    if (!name) nextErrors.name = 'Block name is required.';
    if (!id) nextErrors.id = 'Block code is required.';
    if (data.buildings.some(building => building.id === id && building.id !== (showAdd ? '' : editingBuildingId))) nextErrors.id = 'Block code must be unique.';
    if (draftFloors.length < 1) nextErrors.floors = 'At least one floor is required.';
    const draftFloorIds = new Set(draftFloors.map(floor => floor.id));
    const draftRoomIds = new Set(draftRooms.map(room => room.id));
    const removedLinkedAsset = acStore.getActiveACDataset().find(ac => {
      const removedFloor = ac.location.buildingId === editingBuildingId && !draftFloorIds.has(ac.location.floorId);
      const removedRoom = !draftRoomIds.has(ac.location.roomId) && data.rooms.some(room => room.id === ac.location.roomId && draftFloorIds.has(room.floorId));
      return removedFloor || removedRoom;
    });
    if (removedLinkedAsset) nextErrors.floors = 'Linked AC assets prevent deleting their floor or room.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    await new Promise(resolve => window.setTimeout(resolve, 250));
    const oldId = showAdd ? null : editingBuildingId;
    const finalFloors = draftFloors.map((floor, index) => ({ ...floor, id: `${id}-FLR-${index}`, buildingId: id, order: index }));
    const floorIds = new Map(draftFloors.map((floor, index) => [floor.id, finalFloors[index].id]));
    const roomIds = new Map(draftRooms.map(room => [room.id, room.id.trim() || makeId('room')]));
    const finalRooms = draftRooms.map(room => ({ ...room, id: roomIds.get(room.id) || room.id, floorId: floorIds.get(room.floorId) || room.floorId }));
    const buildings = showAdd ? [...data.buildings, { ...draft, id, name, photos: draft.photos || [], status: draft.status || 'Active' }] : data.buildings.map(building => building.id === oldId ? { ...draft, id, name, photos: draft.photos || [], status: draft.status || 'Active' } : building);
    const floors = [...data.floors.filter(floor => floor.buildingId !== (oldId || id)), ...finalFloors];
    const rooms = [...data.rooms.filter(room => !draftFloors.some(floor => floor.id === room.floorId)), ...finalRooms];
    const originalFloorIds = new Set(data.floors.filter(floor => floor.buildingId === oldId).map(floor => floor.id));
    const departments = data.departments
      .filter(department => !originalFloorIds.has(department.floorId) || draftFloorIds.has(department.floorId))
      .map(department => ({ ...department, floorId: floorIds.get(department.floorId) || department.floorId }));
    if (oldId && oldId !== id) {
      acStore.getActiveACDataset().filter(ac => ac.location.buildingId === oldId).forEach(ac => {
        acStore.updateACAsset(ac.id, { location: { ...ac.location, buildingId: id, floorId: floorIds.get(ac.location.floorId) || ac.location.floorId, roomId: roomIds.get(ac.location.roomId) || ac.location.roomId } });
      });
    }
    updateData({ ...data, buildings, floors, rooms, departments });
    setSaving(false);
    notify('success', showAdd ? 'Block added successfully.' : 'Block updated successfully.');
    closeEditor();
  };

  const deleteBlock = () => {
    if (!deleteTarget) return;
    const linkedAssets = acStore.getActiveACDataset().filter(ac => ac.location.buildingId === deleteTarget.id);
    if (linkedAssets.length) {
      notify('error', `${deleteTarget.name} cannot be deleted because ${linkedAssets.length} linked asset(s) still exist.`);
      setDeleteTarget(null);
      return;
    }
    const floorIds = data.floors.filter(floor => floor.buildingId === deleteTarget.id).map(floor => floor.id);
    updateData({
      buildings: data.buildings.filter(building => building.id !== deleteTarget.id),
      floors: data.floors.filter(floor => floor.buildingId !== deleteTarget.id),
      rooms: data.rooms.filter(room => !floorIds.includes(room.floorId)),
      departments: data.departments.filter(department => !floorIds.includes(department.floorId)),
    });
    setDeleteTarget(null);
    notify('success', `${deleteTarget.name} and its nested locations were removed.`);
  };

  const validateFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) return 'Only JPG, JPEG, PNG, and WEBP photos are accepted.';
    if (file.size > 5 * 1024 * 1024) return 'Each photo must be 5 MB or smaller.';
    return '';
  };

  const uploadPhotos = (files: FileList | File[]) => {
    if (!draft || editorMode === 'view') return;
    const queue = Array.from(files);
    const invalid = queue.map(validateFile).find(Boolean);
    if (invalid) {
      setUploadError(invalid);
      return;
    }
    setUploadError('');
    setUploading(true);
    let completed = 0;
    queue.forEach(file => {
      const reader = new FileReader();
      reader.onprogress = event => {
        if (event.lengthComputable) setUploadProgress(Math.round(((completed + event.loaded / event.total) / queue.length) * 100));
      };
      reader.onload = () => {
        setDraft(current => current ? { ...current, photos: [...current.photos, { id: makeId('photo'), name: file.name, dataUrl: String(reader.result), isCover: current.photos.length === 0 }] } : current);
        completed += 1;
        setUploadProgress(Math.round((completed / queue.length) * 100));
        if (completed === queue.length) setUploading(false);
      };
      reader.onerror = () => { setUploadError(`Could not read ${file.name}.`); setUploading(false); };
      reader.readAsDataURL(file);
    });
  };

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) uploadPhotos(event.target.files);
    event.target.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    uploadPhotos(event.dataTransfer.files);
  };

  const coverPhoto = (building: Building) => (building.photos || []).find(photo => photo.isCover) || building.photos?.[0];
  const totalRooms = (buildingId: string) => {
    const floorIds = data.floors.filter(floor => floor.buildingId === buildingId).map(floor => floor.id);
    return data.rooms.filter(room => floorIds.includes(room.floorId)).length;
  };
  const currentRooms = useMemo(() => draftRooms, [draftRooms]);

  if (!isLoaded) return <div className="flex items-center justify-center py-20 text-sm text-slate-500">Loading campus data...</div>;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {toast && <div className={`fixed right-6 top-20 z-[70] rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{toast.message}</div>}

      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900">Campus Hierarchy</h1><p className="text-sm text-slate-500 mt-1">Manage campus blocks, floors, departments, and rooms.</p></div>
        <button onClick={() => openEditor(null, 'edit')} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"><Plus size={16} /> Add Block</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Buildings', count: data.buildings.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Floors', count: data.floors.length, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
          { label: 'Departments', count: data.departments.length, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Rooms', count: data.rooms.length, icon: Grid3X3, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
        ].map(item => { const Icon = item.icon; return <div key={item.label} className={`rounded-xl border p-4 flex items-center gap-3 ${item.bg}`}><div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm ${item.color} border`}><Icon size={18} /></div><div><p className={`text-2xl font-bold ${item.color}`}>{item.count}</p><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p></div></div>; })}
      </div>

      <div className="flex bg-slate-100 rounded-xl p-1 gap-1 w-fit">{(['buildings', 'departments', 'rooms'] as CampusTab[]).map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>)}</div>

      {activeTab === 'buildings' && <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.buildings.map((building, index) => {
          const photo = coverPhoto(building);
          const floorCount = data.floors.filter(floor => floor.buildingId === building.id).length;
          return <motion.div key={building.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3"><div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center border" style={{ backgroundColor: `${building.layout?.color || '#64748b'}20`, borderColor: `${building.layout?.color || '#64748b'}40` }}>{photo ? <img src={photo.dataUrl} alt={building.name} className="h-full w-full object-cover" /> : <Building2 size={22} style={{ color: building.layout?.color || '#64748b' }} />}</div><div className="flex items-center gap-1"><button onClick={() => openEditor(building, 'view')} className="p-2 rounded-md hover:bg-slate-100 text-slate-600" title="View block"><Eye size={15} /></button><button onClick={() => openEditor(building, 'edit')} className="p-2 rounded-md hover:bg-blue-100 text-blue-600" title="Edit block"><Pencil size={15} /></button><button onClick={() => setDeleteTarget(building)} className="p-2 rounded-md hover:bg-red-100 text-red-600" title="Delete block"><Trash2 size={15} /></button><MoreVertical size={16} className="ml-1 text-slate-400" /></div></div>
            <div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-slate-900 text-sm">{building.name}</p><p className="text-xs text-slate-500 mt-1">{building.id} • {building.type}</p></div><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[building.status || 'Active']}`}>{building.status || 'Active'}</span></div>
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400"><span className="flex items-center gap-1"><Layers size={11} /> {floorCount} Floors</span><span className="flex items-center gap-1"><Grid3X3 size={11} /> {totalRooms(building.id)} Rooms</span></div>
          </motion.div>;
        })}
      </div>}

      {activeTab === 'departments' && <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><table className="w-full text-sm"><thead className="bg-slate-50 border-b border-slate-200"><tr>{['Dept. ID', 'Name', 'Floor'].map(header => <th key={header} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.departments.map(department => <tr key={department.id}><td className="px-4 py-3 font-mono text-sm text-blue-700 font-semibold">{department.id}</td><td className="px-4 py-3 font-medium text-slate-900">{department.name}</td><td className="px-4 py-3 text-slate-500">{department.floorId}</td></tr>)}</tbody></table></div>}
      {activeTab === 'rooms' && <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><table className="w-full text-sm"><thead className="bg-slate-50 border-b border-slate-200"><tr>{['Room ID', 'Name', 'Type', 'Floor'].map(header => <th key={header} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.rooms.map(room => <tr key={room.id}><td className="px-4 py-3 font-mono text-sm text-blue-700 font-semibold">{room.id}</td><td className="px-4 py-3 font-medium text-slate-900">{room.name}</td><td className="px-4 py-3 text-slate-500">{room.type}</td><td className="px-4 py-3 text-slate-500">{room.floorId}</td></tr>)}</tbody></table></div>}

      {deleteTarget && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"><div className="p-5 border-b border-red-100 bg-red-50"><h3 className="font-bold text-lg text-red-800">Delete {deleteTarget.name}?</h3><p className="text-sm text-red-700 mt-1">This will remove {data.floors.filter(floor => floor.buildingId === deleteTarget.id).length} floor(s), {totalRooms(deleteTarget.id)} room(s), and their linked department records.</p></div><div className="p-5 text-sm text-slate-600">Linked AC assets are checked before deletion. The block will stay intact if any assets still point to it.</div><div className="p-5 border-t border-slate-100 flex justify-end gap-3"><button onClick={() => setDeleteTarget(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Cancel</button><button onClick={deleteBlock} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"><Trash2 size={14} /> Delete Block</button></div></div></div>}

      {editorOpen && draft && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"><div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between"><div><h3 className="font-bold text-lg">{showAdd ? 'Add Block' : editorMode === 'view' ? 'Block Details' : 'Edit Block'}</h3><p className="text-xs text-slate-500 mt-1">{draft.name || 'New campus block'}</p></div><button onClick={closeEditor} className="p-2 rounded-full hover:bg-slate-200" title="Close"><X size={18} /></button></div><div className="overflow-y-auto p-6 space-y-6">
        <fieldset disabled={editorMode === 'view' || saving} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-semibold text-slate-500 uppercase">Block name</label><input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${errors.name ? 'border-red-400' : 'border-slate-200'}`} placeholder="Academic Block A" />{errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}</div><div><label className="text-xs font-semibold text-slate-500 uppercase">Block code</label><input value={draft.id} onChange={event => setDraft({ ...draft, id: event.target.value.toUpperCase() })} className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${errors.id ? 'border-red-400' : 'border-slate-200'}`} placeholder="BLK-001" />{errors.id && <p className="text-xs text-red-600 mt-1">{errors.id}</p>}</div><div><label className="text-xs font-semibold text-slate-500 uppercase">Category</label><select value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value })} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">{BLOCK_TYPES.map(type => <option key={type}>{type}</option>)}</select></div><div><label className="text-xs font-semibold text-slate-500 uppercase">Status</label><select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as BuildingStatus })} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">{Object.keys(STATUS_STYLES).map(status => <option key={status}>{status}</option>)}</select></div><div className="md:col-span-2"><label className="text-xs font-semibold text-slate-500 uppercase">Description / notes</label><textarea value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} rows={3} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Describe this block and its facilities..." /></div></div><div><label className="text-xs font-semibold text-slate-500 uppercase">Number of floors</label><input type="number" min={1} step={1} value={draftFloors.length} onChange={event => updateFloorCount(event.target.value)} className={`mt-1 w-32 border rounded-lg px-3 py-2 text-sm ${errors.floors ? 'border-red-400' : 'border-slate-200'}`} />{errors.floors && <p className="text-xs text-red-600 mt-1">{errors.floors}</p>}</div></fieldset>

        <section className="border-t border-slate-100 pt-5"><div className="flex items-center justify-between mb-3"><div><h4 className="font-bold text-slate-800">Floors and rooms</h4><p className="text-xs text-slate-500">Reorder floors and manage rooms inside each floor.</p></div>{editorMode !== 'view' && <button onClick={addFloor} className="text-xs font-semibold text-blue-600 flex items-center gap-1"><Plus size={14} /> Add floor</button>}</div><div className="space-y-3">{draftFloors.map((floor, index) => <div key={floor.id} className="rounded-lg border border-slate-200 p-3"><div className="flex items-center gap-2"><input disabled={editorMode === 'view' || saving} value={floor.name} onChange={event => setDraftFloors(current => current.map(item => item.id === floor.id ? { ...item, name: event.target.value } : item))} className="flex-1 border border-slate-200 rounded-md px-2 py-1.5 text-sm font-medium" /><span className="text-xs text-slate-400">{draftRooms.filter(room => room.floorId === floor.id).length} rooms</span>{editorMode !== 'view' && <><button onClick={() => moveFloor(index, -1)} disabled={index === 0} className="p-1.5 text-slate-500 disabled:opacity-30" title="Move floor up"><ArrowUp size={14} /></button><button onClick={() => moveFloor(index, 1)} disabled={index === draftFloors.length - 1} className="p-1.5 text-slate-500 disabled:opacity-30" title="Move floor down"><ArrowDown size={14} /></button><button onClick={() => deleteFloor(floor.id)} className="p-1.5 text-red-500" title="Delete floor"><Trash2 size={14} /></button><button onClick={() => addRoom(floor.id)} className="p-1.5 text-blue-600" title="Add room"><Plus size={14} /></button></>}</div><div className="mt-2 space-y-2 pl-4">{currentRooms.filter(room => room.floorId === floor.id).map(room => <div key={room.id} className="flex items-center gap-2"><input disabled={editorMode === 'view' || saving} value={room.name} onChange={event => setDraftRooms(current => current.map(item => item.id === room.id ? { ...item, name: event.target.value } : item))} className="flex-1 border border-slate-200 rounded-md px-2 py-1.5 text-xs" /><input disabled={editorMode === 'view' || saving} value={room.type} onChange={event => setDraftRooms(current => current.map(item => item.id === room.id ? { ...item, type: event.target.value } : item))} className="w-32 border border-slate-200 rounded-md px-2 py-1.5 text-xs" /><button disabled={editorMode === 'view' || saving} onClick={() => setDraftRooms(current => current.filter(item => item.id !== room.id))} className="p-1.5 text-red-500" title="Delete room"><Trash2 size={13} /></button></div>)}</div></div>)}</div></section>

        <section className="border-t border-slate-100 pt-5"><div className="flex items-center justify-between mb-3"><div><h4 className="font-bold text-slate-800">Block photos</h4><p className="text-xs text-slate-500">JPG, PNG, or WEBP up to 5 MB each. The cover appears on the card.</p></div><ImagePlus size={18} className="text-slate-400" /></div>{editorMode !== 'view' && <div onDragOver={event => event.preventDefault()} onDrop={onDrop} className="border-2 border-dashed border-slate-200 rounded-lg p-5 text-center hover:border-blue-400 transition-colors"><Upload size={20} className="mx-auto text-slate-400 mb-2" /><p className="text-sm text-slate-600">Drag photos here or <label className="text-blue-600 font-semibold cursor-pointer">choose files<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onFileInput} className="hidden" /></label></p>{uploading && <p className="text-xs text-blue-600 mt-2">Uploading {uploadProgress}%</p>}{uploadError && <p className="text-xs text-red-600 mt-2">{uploadError}</p>}</div>}<div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">{draft.photos.map(photo => <div key={photo.id} className={`relative aspect-square rounded-lg overflow-hidden border-2 ${photo.isCover ? 'border-blue-500' : 'border-slate-200'}`}><button onClick={() => setLightbox(photo)} className="h-full w-full"><img src={photo.dataUrl} alt={photo.name} className="h-full w-full object-cover" /></button>{photo.isCover && <span className="absolute left-1 top-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">Cover</span>}{editorMode !== 'view' && <div className="absolute bottom-1 right-1 flex gap-1"><button onClick={() => setDraft({ ...draft, photos: draft.photos.map(item => ({ ...item, isCover: item.id === photo.id })) })} className="rounded bg-white/90 px-1.5 py-1 text-[10px] text-blue-700">Set cover</button><button onClick={() => setDraft({ ...draft, photos: draft.photos.filter(item => item.id !== photo.id) })} className="rounded bg-white/90 p-1 text-red-600" title="Delete photo"><Trash2 size={12} /></button></div>}</div>)}</div></section>
      </div><div className="p-5 border-t border-slate-100 flex justify-end gap-3"><button onClick={closeEditor} disabled={saving} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Close</button>{editorMode === 'view' ? <button onClick={() => setEditorMode('edit')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"><Pencil size={14} /> Edit Block</button> : <button onClick={saveBlock} disabled={saving || uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : showAdd ? 'Add Block' : 'Save Changes'}</button>}</div></div></div>}

      {lightbox && <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-6" onClick={() => setLightbox(null)}><button className="absolute right-5 top-5 text-white" onClick={() => setLightbox(null)}><X size={26} /></button><img src={lightbox.dataUrl} alt={lightbox.name} className="max-h-[85vh] max-w-[90vw] object-contain" onClick={event => event.stopPropagation()} /></div>}
    </div>
  );
}
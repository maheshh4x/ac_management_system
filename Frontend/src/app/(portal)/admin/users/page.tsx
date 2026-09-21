'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockUsers, MockUser } from '@/lib/mock-data';
import { Users, Plus, Search, Edit3, UserX, UserCheck, ShieldCheck, X } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  FACILITY_MANAGER: 'bg-blue-100 text-blue-700 border-blue-200',
  TECHNICIAN: 'bg-teal-100 text-teal-700 border-teal-200',
  VIEWER: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function UsersPage() {
  const [users, setUsers] = useState<MockUser[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<MockUser | null>(null);

  const filtered = users.filter(u => [u.name, u.email, u.department, u.role].join(' ').toLowerCase().includes(search.toLowerCase()));

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u));
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User & Role Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage system users, assign roles and control access.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Role overview tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['SUPER_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN', 'VIEWER'] as const).map(role => {
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className={`rounded-xl border p-4 ${ROLE_COLORS[role]}`}>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider">{role.replace('_', ' ')}</span>
              </div>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs opacity-70">users</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Search by name, email, department..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['User', 'Email', 'Role', 'Department', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {u.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${ROLE_COLORS[u.role]}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{u.department}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${u.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{u.createdAt}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditUser(u)} className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600" title="Edit"><Edit3 size={14} /></button>
                      <button onClick={() => toggleStatus(u.id)} className={`p-1.5 rounded-md transition-colors ${u.status === 'Active' ? 'hover:bg-red-100 text-red-500' : 'hover:bg-emerald-100 text-emerald-600'}`} title={u.status === 'Active' ? 'Deactivate' : 'Activate'}>
                        {u.status === 'Active' ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg">Add New User</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-full hover:bg-slate-200"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="text-xs font-semibold text-slate-500 uppercase">Full Name</label><input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Dr. Name Surname" /></div>
                <div><label className="text-xs font-semibold text-slate-500 uppercase">Email</label><input type="email" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="user@college.com" /></div>
                <div><label className="text-xs font-semibold text-slate-500 uppercase">Phone</label><input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+91 99..." /></div>
                <div><label className="text-xs font-semibold text-slate-500 uppercase">Role</label>
                  <select className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="VIEWER">Viewer</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="FACILITY_MANAGER">Facility Manager</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-slate-500 uppercase">Department</label><input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="CSE" /></div>
              </div>
              <p className="text-xs text-slate-400">Default password: <strong>Admin@123</strong>. User will be prompted to change on first login.</p>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={() => { alert('User created! (Mock)'); setShowAdd(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5"><Plus size={14} /> Create User</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

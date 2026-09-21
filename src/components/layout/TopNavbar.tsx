'use client';

import React from 'react';
import { Bell, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GlobalSearch } from '@/components/features/GlobalSearch';

export function TopNavbar() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-md">
        <GlobalSearch />
      </div>

      {/* Right User & System Controls */}
      <div className="flex items-center gap-4">
        {/* Role Badge */}
        {user?.role && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-200">
            <ShieldCheck size={14} className="text-blue-600" />
            <span>{user.role.replace('_', ' ')}</span>
          </div>
        )}

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
        </button>

        {/* User Avatar & Name */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : <User size={16} />}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-bold text-slate-900 leading-none">{user?.name || 'Admin User'}</span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">{user?.email || 'nitttr.edu.in'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

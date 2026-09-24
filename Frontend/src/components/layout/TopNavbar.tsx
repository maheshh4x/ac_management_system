'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, ShieldCheck, User, LogOut, UserCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GlobalSearch } from '@/components/features/GlobalSearch';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Admin',
  FACILITY_MANAGER: 'Faculty Manager',
  TECHNICIAN: 'Technician',
  VIEWER: 'Viewer',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-blue-600',
  FACILITY_MANAGER: 'bg-emerald-600',
  TECHNICIAN: 'bg-amber-500',
  VIEWER: 'bg-slate-500',
};

export function TopNavbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roleBase = user?.role === 'SUPER_ADMIN' ? '/admin'
    : user?.role === 'FACILITY_MANAGER' ? '/manager'
    : user?.role === 'TECHNICIAN' ? '/technician'
    : '/viewer';

  const profileHref = `${roleBase}/profile`;
  const avatarBg = ROLE_COLORS[user?.role ?? ''] ?? 'bg-slate-500';
  const roleLabel = ROLE_LABELS[user?.role ?? ''] ?? (user?.role ?? '');

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-md">
        <GlobalSearch />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        {user?.role && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-200">
            <ShieldCheck size={14} className="text-blue-600" />
            <span>{roleLabel}</span>
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

        {/* User Avatar / Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:bg-slate-50 rounded-lg pr-2 py-1 transition-colors group"
            aria-label="User menu"
          >
            <div className={`w-8 h-8 rounded-full ${avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-sm`}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : <User size={16} />}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-none">{user?.name || 'User'}</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 leading-none">{user?.email || ''}</span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 overflow-hidden"
              >
                {/* User info header */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-sm`}>
                      {user?.name ? user.name.slice(0, 2).toUpperCase() : <User size={16} />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 leading-tight">{user?.name || 'User'}</div>
                      <div className="text-[11px] text-slate-500 leading-tight truncate max-w-[130px]">{user?.email || ''}</div>
                      <div className="text-[10px] text-blue-600 font-semibold mt-0.5">{roleLabel}</div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <button
                  onClick={() => { setDropdownOpen(false); router.push(profileHref); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <UserCircle size={16} className="text-slate-400" />
                  My Profile
                </button>

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => { setDropdownOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-semibold"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

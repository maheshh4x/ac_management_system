'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, CheckCircle2, QrCode, LogOut, ArrowRight, Map } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function TechnicianDashboardPage() {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col gap-6 pb-8 max-w-2xl mx-auto">
      <div className="flex flex-col gap-1 items-center text-center mt-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 shadow-sm border border-blue-200">
           <Wrench size={28} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Welcome, {user?.name}</h1>
        <p className="text-text-secondary text-sm">Field Technician Portal</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-card border border-card-border rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
           <span className="text-3xl font-bold text-slate-800">3</span>
           <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Pending Jobs</span>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
           <span className="text-3xl font-bold text-green-600">5</span>
           <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Completed</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest px-1">Quick Actions</h2>
        
        <Link href="/technician/scan" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 flex items-center justify-between shadow-sm transition-colors group">
           <div className="flex items-center gap-3">
              <QrCode size={24} />
              <span className="font-medium text-lg">Scan AC QR Code</span>
           </div>
           <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
        
        <Link href="/technician/jobs" className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm transition-colors group">
           <div className="flex items-center gap-3">
              <Wrench size={24} className="text-slate-500" />
              <span className="font-medium">My Assigned Jobs</span>
           </div>
           <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">3</span>
        </Link>
        
        <Link href="/campus" className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm transition-colors group">
           <div className="flex items-center gap-3">
              <Map size={24} className="text-slate-500" />
              <span className="font-medium">Locate AC on Map</span>
           </div>
           <ArrowRight className="text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      
      <div className="mt-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest px-1 mb-3">Today's Jobs</h2>
        <div className="space-y-3">
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                 <span className="font-bold text-slate-800">Job #102</span>
                 <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Pending</span>
              </div>
              <div className="text-sm text-slate-600">
                 AC not cooling properly.
              </div>
              <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded inline-flex self-start mt-1">
                 Loc: Block B → Floor 2 → Room B-204
              </div>
              <button className="mt-2 text-sm bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg font-medium transition-colors">Start Job</button>
           </div>
        </div>
      </div>
    </div>
  );
}

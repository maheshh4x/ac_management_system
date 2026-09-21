'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { KpiCard } from '@/components/ui/KpiCard';
import { mockACs } from '@/lib/mock-campus-database';
import { Airplay, CheckCircle2, ShieldCheck, Map } from 'lucide-react';
import Link from 'next/link';

export default function ViewerDashboardPage() {
  const totalAcs = mockACs.length;
  const workingAcs = mockACs.filter(a => a.status === 'Working').length;

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Observer Dashboard</h1>
        <p className="text-text-secondary text-sm">Read-only view of AC assets and campus infrastructure.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, staggerChildren: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <KpiCard title="Total ACs" value={totalAcs} icon={Airplay} color="brand" trendPositive={true} />
        <KpiCard title="Working ACs" value={workingAcs} icon={CheckCircle2} color="success" trendPositive={true} />
        <KpiCard title="Role Access" value="Viewer" icon={ShieldCheck} color="warning" trend="Read-only" trendPositive={false} />
      </motion.div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl flex items-center justify-between">
         <div className="max-w-xl">
           <h3 className="text-lg font-bold text-blue-900">Explore 3D Campus map</h3>
           <p className="text-blue-700 text-sm mt-1">Navigate visually through all departments and blocks to see where each AC is installed.</p>
         </div>
         <Link href="/campus" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2">
           <Map size={18} /> Open 3D Map
         </Link>
      </div>

      <div className="bg-card rounded-xl border border-card-border p-6 mt-4">
         <h3 className="font-semibold text-lg text-slate-800 border-b border-slate-100 pb-4 mb-4">Recent Status Updates</h3>
         <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center text-slate-600">
               <span>AC-127 assigned to Room A204</span>
               <span className="text-xs text-slate-400">2 mins ago</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
               <span>Maintenance completed for AC-129</span>
               <span className="text-xs text-slate-400">1 hr ago</span>
            </div>
         </div>
      </div>
    </div>
  );
}

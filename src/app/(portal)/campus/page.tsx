'use client';

import React from 'react';
import { CampusProvider } from '@/contexts/CampusContext';
import CampusCanvas from '@/components/campus/CampusCanvas';
import CampusOverlay from '@/components/campus/ui/CampusOverlay';

export default function CampusPage() {
  return (
    <CampusProvider>
      <div className="relative w-full h-[calc(100vh-80px)] rounded-xl overflow-hidden shadow-lg border border-border bg-slate-900 group">
        <CampusCanvas />
        <CampusOverlay />
      </div>
    </CampusProvider>
  );
}

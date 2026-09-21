'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ZapOff } from 'lucide-react';

export function EnergyPlaceholderChart({ title, message }: { title: string, message: string }) {
  return (
    <div className="flex flex-col h-[280px] w-full items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
        <ZapOff size={32} />
      </div>
      <h4 className="text-lg font-bold text-slate-700 mb-2">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm">
        {message}
      </p>
    </div>
  );
}

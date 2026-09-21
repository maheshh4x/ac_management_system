// src/components/ui/DataSourceIndicator.tsx
'use client';

import React from 'react';
import { Database, ShieldCheck, Info, RefreshCw } from 'lucide-react';
import { DataSourceStatus } from '@/lib/ac-data-service';

interface DataSourceIndicatorProps {
  dataSource: DataSourceStatus;
  onResetDemo?: () => void;
  showDetails?: boolean;
}

export const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({
  dataSource,
  onResetDemo,
  showDetails = true
}) => {
  const { isDemo, label, demoCount, realCount, totalCount, lastImportDate } = dataSource;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
            Data Source
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
              isDemo
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isDemo ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            {label}
          </span>
        </div>

        {showDetails && (
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 border-l border-slate-200 pl-3">
            <span>
              <strong className="text-slate-700">{totalCount}</strong> Total AC Assets
            </span>
            {isDemo ? (
              <span className="text-amber-700 font-medium">({demoCount} Sample/Demo Records)</span>
            ) : (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <ShieldCheck size={13} /> Verified NITTTR Dataset
              </span>
            )}
            {lastImportDate && (
              <span className="text-slate-400">Imported: {lastImportDate}</span>
            )}
          </div>
        )}
      </div>

      {!isDemo && onResetDemo && (
        <button
          onClick={onResetDemo}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 hover:underline transition-all"
          title="Restore original demo dataset for testing"
        >
          <RefreshCw size={12} /> Reset to Demo Mode
        </button>
      )}
    </div>
  );
};

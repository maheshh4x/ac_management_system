'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { usePathname } from 'next/navigation';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  
  // Do not wrap Login or 403 in this layout
  if (pathname === '/login' || pathname === '/403') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <TopNavbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

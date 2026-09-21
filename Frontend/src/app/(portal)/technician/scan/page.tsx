'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Search, CheckCircle2, Airplay, MapPin, ArrowRight, X, Camera } from 'lucide-react';
import { mockACs } from '@/lib/mock-campus-database';

export default function TechnicianScanPage() {
  const [scanQuery, setScanQuery] = useState('');
  const [scannedAC, setScannedAC] = useState<typeof mockACs[0] | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleSearch = () => {
    const found = mockACs.find(ac => ac.id.toLowerCase() === scanQuery.toLowerCase() || ac.serialNumber.toLowerCase() === scanQuery.toLowerCase());
    if (found) {
      setScannedAC(found);
    } else {
      alert('No AC unit found with this ID or Serial Number.');
    }
  };

  const simulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedAC(mockACs[0]); // Simulate finding AC-127
      setScanQuery('AC-127');
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-lg mx-auto">
      <div className="text-center mt-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mx-auto mb-3 shadow-sm">
          <QrCode size={28} className="text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Scan AC QR Code</h1>
        <p className="text-sm text-slate-500 mt-1">Scan an AC unit's QR code or enter the AC ID manually.</p>
      </div>

      {/* Camera Simulation Box */}
      <div 
        onClick={simulateScan}
        className={`relative h-52 rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-all ${isScanning ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-100 hover:bg-slate-50 hover:border-slate-400'}`}
      >
        {isScanning ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-blue-700 font-medium text-sm">Scanning...</p>
            {/* Scanning line animation */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 opacity-70 animate-bounce" style={{ animationDuration: '1s' }} />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Camera size={40} />
            <p className="font-medium text-sm">Tap to simulate QR scan</p>
            <p className="text-xs">(Will auto-detect AC-127)</p>
          </div>
        )}
        {/* Corner brackets visual */}
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-slate-400 rounded-tl" />
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-slate-400 rounded-tr" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-slate-400 rounded-bl" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-slate-400 rounded-br" />
      </div>

      {/* Manual Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Enter AC ID (e.g. AC-127)"
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={scanQuery}
            onChange={e => setScanQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button onClick={handleSearch} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors">
          Search
        </button>
      </div>

      {/* Result Card */}
      {scannedAC && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
        >
          <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Airplay size={20} />
            </div>
            <div>
              <p className="font-bold text-lg">{scannedAC.id}</p>
              <p className="text-blue-100 text-sm">{scannedAC.make} {scannedAC.model}</p>
            </div>
            <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${scannedAC.status === 'Working' ? 'bg-emerald-500' : 'bg-red-500'}`}>
              {scannedAC.status}
            </span>
          </div>

          <div className="p-4 grid grid-cols-2 gap-3 text-sm">
            {[
              ['Type', scannedAC.type], ['Capacity', scannedAC.capacity],
              ['Serial No.', scannedAC.serialNumber], ['Power', scannedAC.powerRating],
              ['Mfg. Year', scannedAC.manufacturingYear], ['Last Service', scannedAC.lastMaintenanceDate],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <span className="text-slate-400 text-xs uppercase font-semibold tracking-wide">{k}</span>
                <span className="text-slate-800 font-medium">{v}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <MapPin size={13} className="text-slate-400" />
              <span>{scannedAC.location.buildingId} → {scannedAC.location.floorId.split('-').pop()} → {scannedAC.location.roomId}</span>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-2.5 border-t border-slate-100">
            <button className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> Report an Issue
            </button>
            <button 
              onClick={() => {
                setScannedAC(null);
                setScanQuery('');
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
            >
              Clear / Scan Another
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

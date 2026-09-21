// src/components/features/csv-import/ImportACModal.tsx
'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, X, ArrowRight,
  RotateCcw, ShieldCheck, Info, FileText, Check, AlertOctagon, HelpCircle,
  Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, File as FileIcon,
  Layers, Trash2, RefreshCw,
} from 'lucide-react';
import {
  downloadCSVTemplate, autoMapHeaders, parseAndCleanRows, SYSTEM_FIELDS, downloadValidationReport,
} from './csv-cleaner-validator';
import {
  readFileMetadata, parseSelectedSheet, getFileTypeLabel, formatFileSize, getFileCategory,
} from './excel-parser';
import { ExtendedAC, CSVRowCleaned, ImportPreviewSummary, ValidationProblem } from '@/lib/ac-data-service';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ImportACModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingACs: ExtendedAC[];
  onImportSuccess: (cleanedACs: ExtendedAC[], mode: 'add' | 'replace') => Promise<any>;
}

type ImportStep =
  | 'SELECT_FILE'
  | 'SELECT_WORKSHEET'
  | 'COLUMN_MAPPING'
  | 'PREVIEW'
  | 'SELECT_IMPORT_MODE'
  | 'CONFIRM_REPLACE'
  | 'PROCESSING'
  | 'RESULT';

type SortDir = 'asc' | 'desc' | null;

const ROWS_PER_PAGE = 50;

// ─── Step indicator helper ────────────────────────────────────────────────────
const STEPS: { id: ImportStep; label: string }[] = [
  { id: 'SELECT_FILE',       label: 'Upload File' },
  { id: 'SELECT_WORKSHEET',  label: 'Worksheet'   },
  { id: 'COLUMN_MAPPING',    label: 'Map Columns' },
  { id: 'PREVIEW',           label: 'Preview'     },
  { id: 'SELECT_IMPORT_MODE',label: 'Import Mode' },
  { id: 'CONFIRM_REPLACE',   label: 'Confirm'     },
];

// ─── Main Modal ───────────────────────────────────────────────────────────────
export const ImportACModal: React.FC<ImportACModalProps> = ({
  isOpen, onClose, existingACs, onImportSuccess,
}) => {
  // wizard state
  const [step, setStep] = useState<ImportStep>('SELECT_FILE');
  const [importMode, setImportMode] = useState<'add' | 'replace'>('add');

  // file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'excel' | 'csv'>('csv');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // raw parsed data
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);

  // mapping & validation
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [cleanedRows, setCleanedRows] = useState<CSVRowCleaned[]>([]);
  const [previewSummary, setPreviewSummary] = useState<ImportPreviewSummary | null>(null);
  const [problems, setProblems] = useState<ValidationProblem[]>([]);

  // preview table UI
  const [previewSearch, setPreviewSearch] = useState('');
  const [previewFilter, setPreviewFilter] = useState<string>('ALL');
  const [sortCol, setSortCol] = useState<string>('');
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [previewPage, setPreviewPage] = useState(1);

  // import process
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('Preparing import...');
  const [importResult, setImportResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const demoCountInExisting = existingACs.filter(a => a.isDemo).length;

  // ── Step index for progress bar ──────────────────────────────────────────
  const currentStepIndex = STEPS.findIndex(s => s.id === step);

  // ── Reset everything ─────────────────────────────────────────────────────
  const handleReset = () => {
    setStep('SELECT_FILE');
    setSelectedFile(null);
    setSheetNames([]);
    setSelectedSheet('');
    setRawHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setCleanedRows([]);
    setPreviewSummary(null);
    setProblems([]);
    setPreviewSearch('');
    setPreviewFilter('ALL');
    setSortCol('');
    setSortDir(null);
    setPreviewPage(1);
    setProgress(0);
    setImportResult(null);
    setErrorMsg(null);
    setIsLoading(false);
  };

  // ── File selection handling ───────────────────────────────────────────────
  const handleFileSelected = async (file: File) => {
    setErrorMsg(null);
    const category = getFileCategory(file);
    if (category === 'unsupported') {
      setErrorMsg('Unsupported file type. Please upload a .xlsx, .xls, or .csv file.');
      return;
    }
    setIsLoading(true);
    try {
      const meta = await readFileMetadata(file);
      setSelectedFile(file);
      setFileType(meta.fileType);
      setSheetNames(meta.sheetNames);

      if (meta.fileType === 'excel' && meta.sheetNames.length > 1) {
        // Let user pick a sheet
        setSelectedSheet(meta.sheetNames[0]);
        setStep('SELECT_WORKSHEET');
      } else {
        // Auto-select the only sheet (or CSV)
        const sheet = meta.sheetNames[0] || 'Sheet1';
        setSelectedSheet(sheet);
        await loadSheetData(file, meta.fileType, sheet);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to read file.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSheetData = async (file: File, fType: 'excel' | 'csv', sheet: string) => {
    setIsLoading(true);
    try {
      const { headers, rows } = await parseSelectedSheet(file, fType, sheet);
      setRawHeaders(headers);
      setRawRows(rows);
      const autoMap = autoMapHeaders(headers);
      setColumnMapping(autoMap);
      setStep('COLUMN_MAPPING');
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to read Excel file.');
    } finally {
      setIsLoading(false);
    }
  };

  // Drag & drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  // ── After worksheet selected ──────────────────────────────────────────────
  const handleSheetContinue = async () => {
    if (!selectedFile) return;
    await loadSheetData(selectedFile, fileType, selectedSheet);
  };

  // ── Apply mapping → validate → go to preview ─────────────────────────────
  const handleApplyMapping = async () => {
    if (!rawRows.length) return;
    setIsLoading(true);
    try {
      const parsed = await parseAndCleanRows(rawRows, rawHeaders, columnMapping, existingACs);
      setCleanedRows(parsed.rows);
      setPreviewSummary(parsed.summary);
      setProblems(parsed.allProblems);
      setPreviewPage(1);
      setStep('PREVIEW');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to validate data.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Execute the import ────────────────────────────────────────────────────
  const handleExecuteImport = async () => {
    const validACs: ExtendedAC[] = cleanedRows
      .filter(r => r.status === 'CREATE' || r.status === 'UPDATE')
      .map(r => r.cleaned as ExtendedAC);

    if (validACs.length === 0) {
      setErrorMsg('No valid AC records available to import.');
      return;
    }

    setStep('PROCESSING');
    setProgress(10);
    setProgressText('Preparing dataset...');

    try {
      await delay(300);  setProgress(35); setProgressText('Validating data integrity...');
      await delay(300);  setProgress(65); setProgressText(
        importMode === 'replace'
          ? 'Removing demo data & inserting college records...'
          : 'Inserting new records...'
      );
      await delay(400);  setProgress(90); setProgressText('Refreshing portal views...');

      const res = await onImportSuccess(validACs, importMode);
      setProgress(100);
      setProgressText('Import complete!');
      await delay(300);
      setImportResult(res);
      setStep('RESULT');
    } catch (err: any) {
      setErrorMsg(err.message || 'Import failed. No existing data was changed.');
      setStep('SELECT_IMPORT_MODE');
    }
  };

  // ── Preview table data ────────────────────────────────────────────────────
  const previewColumns = rawHeaders.slice(0, 10); // show up to 10 raw cols in table

  const filteredRows = useMemo(() => {
    let rows = cleanedRows;
    if (previewFilter !== 'ALL') rows = rows.filter(r => r.status === previewFilter);
    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase();
      rows = rows.filter(r =>
        Object.values(r.raw).some(v => v.toLowerCase().includes(q)) ||
        (r.cleaned.id && r.cleaned.id.toLowerCase().includes(q))
      );
    }
    if (sortCol && sortDir) {
      rows = [...rows].sort((a, b) => {
        const va = (a.raw[sortCol] || '').toLowerCase();
        const vb = (b.raw[sortCol] || '').toLowerCase();
        const cmp = va.localeCompare(vb, undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [cleanedRows, previewFilter, previewSearch, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const pagedRows = filteredRows.slice((previewPage - 1) * ROWS_PER_PAGE, previewPage * ROWS_PER_PAGE);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortCol('');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* ── Header ── */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Import AC Asset Data</h2>
              <p className="text-xs text-slate-500 hidden sm:block">Upload Excel or CSV — all rows and columns are preserved.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* ── Step Progress Bar ── */}
        {!['PROCESSING', 'RESULT'].includes(step) && (
          <div className="px-5 pt-4 pb-0 shrink-0">
            <div className="flex items-center gap-1">
              {STEPS.filter(s => !(s.id === 'SELECT_WORKSHEET' && fileType === 'csv' && sheetNames.length <= 1))
                    .filter(s => !(s.id === 'CONFIRM_REPLACE' && importMode !== 'replace'))
                    .map((s, i, arr) => {
                const idx = STEPS.findIndex(x => x.id === s.id);
                const done = idx < currentStepIndex;
                const active = s.id === step;
                return (
                  <React.Fragment key={s.id}>
                    <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full transition-all ${
                      active ? 'bg-blue-600 text-white' : done ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {done ? <Check size={10} /> : null}
                      {s.label}
                    </div>
                    {i < arr.length - 1 && <div className={`flex-1 h-0.5 rounded ${done ? 'bg-blue-400' : 'bg-slate-200'}`} />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Error Alert ── */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex items-center justify-between shrink-0"
            >
              <span className="flex items-center gap-1.5"><AlertTriangle size={13} />{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="p-1 ml-2"><X size={13} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Body ── */}
        <div className="p-5 flex-1 overflow-y-auto min-h-0">

          {/* ====== STEP 1: SELECT FILE ====== */}
          {step === 'SELECT_FILE' && (
            <div className="space-y-5">
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !isLoading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all select-none ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20'
                }`}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); }}
                />
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-sm transition-transform ${
                  isDragging ? 'bg-blue-600 text-white scale-110' : 'bg-white border border-slate-200 text-blue-600'
                }`}>
                  {isLoading ? (
                    <div className="w-7 h-7 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                  ) : (
                    <Upload size={28} />
                  )}
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1">
                  {isDragging ? 'Drop your file here' : 'Drag & Drop Excel or CSV'}
                </h3>
                <p className="text-xs text-slate-500 mb-4">or click to choose a file from your computer</p>
                <div className="flex items-center justify-center gap-2">
                  {['.xlsx', '.xls', '.csv'].map(ext => (
                    <span key={ext} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                      {ext}
                    </span>
                  ))}
                </div>
              </div>

              {/* Template download hint */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="flex items-center gap-1.5">
                  <Info size={12} />
                  Don't have a file ready? Download the CSV template to see the expected format.
                </span>
                <button
                  onClick={downloadCSVTemplate}
                  className="flex items-center gap-1.5 text-blue-600 font-semibold hover:underline"
                >
                  <Download size={12} /> Download Template
                </button>
              </div>
            </div>
          )}

          {/* ====== STEP 2: SELECT WORKSHEET ====== */}
          {step === 'SELECT_WORKSHEET' && selectedFile && (
            <div className="space-y-5">
              {/* File info card */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl border border-green-100">
                  <FileSpreadsheet size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{getFileTypeLabel(selectedFile)} · {formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 font-semibold transition-colors"
                >
                  <Trash2 size={13} /> Change File
                </button>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
                  <Layers size={12} className="inline mr-1" />
                  Select Worksheet ({sheetNames.length} sheet{sheetNames.length !== 1 ? 's' : ''} found)
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {sheetNames.map(name => (
                    <label
                      key={name}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedSheet === name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="sheet"
                        value={name}
                        checked={selectedSheet === name}
                        onChange={() => setSelectedSheet(name)}
                        className="accent-blue-600"
                      />
                      <div>
                        <span className="font-semibold text-sm text-slate-800">{name}</span>
                        <span className="ml-2 text-[10px] text-slate-400 font-mono">worksheet</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ====== STEP 3: COLUMN MAPPING ====== */}
          {step === 'COLUMN_MAPPING' && (
            <div className="space-y-5">
              {/* File + sheet summary */}
              {selectedFile && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <FileSpreadsheet size={16} className="text-green-600 shrink-0" />
                  <span className="font-bold text-slate-700 truncate">{selectedFile.name}</span>
                  {fileType === 'excel' && <span className="text-slate-400">→ <strong>{selectedSheet}</strong></span>}
                  <span className="text-slate-400 ml-auto">{rawRows.length} rows · {rawHeaders.length} columns</span>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 flex items-start gap-2">
                <Info size={15} className="shrink-0 mt-0.5" />
                <div>
                  <strong>Map Excel Columns → System Fields.</strong> We've auto-detected likely mappings.
                  Unmapped columns are preserved in the raw data. Only AC_ID and Serial Number are used for duplicate detection.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {SYSTEM_FIELDS.map(sys => {
                  const mappedCol = Object.keys(columnMapping).find(c => columnMapping[c] === sys.key) || '';
                  return (
                    <div key={sys.key} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-800">{sys.label}</span>
                        <span className="text-[10px] font-mono text-slate-400">{sys.key}</span>
                      </div>
                      <select
                        value={mappedCol}
                        onChange={e => {
                          const newMap = { ...columnMapping };
                          // Remove old mapping for this field
                          Object.keys(newMap).forEach(k => { if (newMap[k] === sys.key) delete newMap[k]; });
                          if (e.target.value) newMap[e.target.value] = sys.key;
                          setColumnMapping(newMap);
                        }}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">-- Not Mapped --</option>
                        {rawHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-slate-400 flex items-center gap-1">
                <HelpCircle size={11} />
                Unmapped columns from the file are still shown in the preview and preserved in raw data.
              </p>
            </div>
          )}

          {/* ====== STEP 4: PREVIEW ====== */}
          {step === 'PREVIEW' && previewSummary && (
            <div className="space-y-4">
              {/* File Info Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { label: 'File', value: selectedFile?.name || '—' },
                  { label: 'Type', value: selectedFile ? getFileTypeLabel(selectedFile).split('(')[0].trim() : '—' },
                  { label: 'Worksheet', value: fileType === 'excel' ? selectedSheet : 'CSV' },
                  { label: 'Total Rows', value: String(previewSummary.totalRows) },
                ].map(i => (
                  <div key={i.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{i.label}</span>
                    <span className="font-bold text-slate-800 text-sm truncate block">{i.value}</span>
                  </div>
                ))}
              </div>

              {/* Quality Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: 'All Rows',   count: previewSummary.totalRows,      filter: 'ALL',       color: 'bg-slate-800 text-white', inactiveColor: 'bg-slate-100 border-slate-200 text-slate-700' },
                  { label: 'New',        count: previewSummary.newRecords,     filter: 'CREATE',    color: 'bg-emerald-600 text-white', inactiveColor: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                  { label: 'Updates',    count: previewSummary.updatesCount,   filter: 'UPDATE',    color: 'bg-blue-600 text-white', inactiveColor: 'bg-blue-50 border-blue-200 text-blue-800' },
                  { label: 'Duplicates', count: previewSummary.duplicatesCount,filter: 'DUPLICATE', color: 'bg-amber-500 text-white', inactiveColor: 'bg-amber-50 border-amber-200 text-amber-800' },
                  { label: 'Invalid',    count: previewSummary.invalidRecords, filter: 'INVALID',   color: 'bg-red-600 text-white', inactiveColor: 'bg-red-50 border-red-200 text-red-800' },
                ].map(c => (
                  <div
                    key={c.filter}
                    onClick={() => { setPreviewFilter(c.filter); setPreviewPage(1); }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all text-center ${
                      previewFilter === c.filter ? c.color : c.inactiveColor
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold opacity-80 block">{c.label}</span>
                    <span className="text-xl font-bold">{c.count}</span>
                  </div>
                ))}
              </div>

              {/* Search + Report */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={previewSearch}
                    onChange={e => { setPreviewSearch(e.target.value); setPreviewPage(1); }}
                    placeholder="Search rows..."
                    className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                {problems.length > 0 && (
                  <button
                    onClick={() => downloadValidationReport(problems)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors whitespace-nowrap"
                  >
                    <Download size={12} /> Report ({problems.length})
                  </button>
                )}
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs text-left min-w-[700px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5 font-bold">Row</th>
                        <th className="p-2.5 font-bold">Status</th>
                        {previewColumns.map(col => (
                          <th
                            key={col}
                            className="p-2.5 font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap select-none"
                            onClick={() => handleSort(col)}
                          >
                            <span className="flex items-center gap-1">
                              {col}
                              {sortCol === col ? (
                                sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                              ) : (
                                <span className="opacity-30"><ChevronUp size={11} /></span>
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagedRows.length === 0 ? (
                        <tr>
                          <td colSpan={previewColumns.length + 2} className="p-8 text-center text-slate-400">
                            No rows match the current filter.
                          </td>
                        </tr>
                      ) : pagedRows.map(r => (
                        <tr key={r.rowIndex} className={`hover:bg-slate-50 ${r.status === 'DUPLICATE' ? 'bg-amber-50/50' : r.status === 'INVALID' ? 'bg-red-50/50' : ''}`}>
                          <td className="p-2.5 font-mono text-slate-400">#{r.rowIndex}</td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.status === 'CREATE'    ? 'bg-emerald-100 text-emerald-800' :
                              r.status === 'UPDATE'    ? 'bg-blue-100 text-blue-800' :
                              r.status === 'DUPLICATE' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {r.status === 'DUPLICATE' ? 'Possible Dup — Review' : r.status}
                            </span>
                          </td>
                          {previewColumns.map(col => (
                            <td key={col} className="p-2.5 max-w-[180px] truncate text-slate-700" title={r.raw[col]}>
                              {r.raw[col] || <span className="text-slate-300">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-3 border-t border-slate-100 bg-slate-50 text-xs">
                    <span className="text-slate-500">
                      Showing {(previewPage - 1) * ROWS_PER_PAGE + 1}–{Math.min(previewPage * ROWS_PER_PAGE, filteredRows.length)} of {filteredRows.length} rows
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={previewPage === 1}
                        onClick={() => setPreviewPage(p => p - 1)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40"
                      ><ChevronLeft size={13} /></button>
                      <span className="px-3 py-1 font-semibold">{previewPage} / {totalPages}</span>
                      <button
                        disabled={previewPage === totalPages}
                        onClick={() => setPreviewPage(p => p + 1)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40"
                      ><ChevronRight size={13} /></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ====== STEP 5: SELECT IMPORT MODE ====== */}
          {step === 'SELECT_IMPORT_MODE' && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>{previewSummary?.validRecords || 0} valid records</strong> ready to import
                  ({previewSummary?.newRecords || 0} new + {previewSummary?.updatesCount || 0} updates).
                  {previewSummary?.duplicatesCount ? ` ${previewSummary.duplicatesCount} possible duplicate(s) will be kept for review.` : ''}
                </div>
              </div>

              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">Choose Import Mode</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    value: 'add' as const,
                    title: 'Add to Existing Data',
                    desc: 'Appends the imported records to the current dataset. Existing records remain intact.',
                    border: 'border-blue-600 bg-blue-50/50',
                    inactive: 'border-slate-200 hover:border-slate-300 bg-white',
                  },
                  {
                    value: 'replace' as const,
                    title: 'Replace Demo Data',
                    badge: 'Recommended',
                    desc: `Removes the ${demoCountInExisting} sample/demo records (marked isDemo) and replaces them with the official college dataset.`,
                    border: 'border-amber-500 bg-amber-50/50',
                    inactive: 'border-slate-200 hover:border-slate-300 bg-white',
                  },
                ].map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => setImportMode(opt.value)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      importMode === opt.value ? opt.border : opt.inactive
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{opt.title}</h4>
                          {'badge' in opt && opt.badge && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-200 text-amber-900">{opt.badge}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
                      </div>
                      <input type="radio" checked={importMode === opt.value} readOnly className="mt-1 accent-blue-600 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ====== STEP 6: CONFIRM REPLACE ====== */}
          {step === 'CONFIRM_REPLACE' && (
            <div className="space-y-5">
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-amber-900 space-y-3">
                <div className="flex items-center gap-2 font-bold text-base">
                  <AlertOctagon size={22} className="text-amber-600" /> Confirm Demo Data Replacement
                </div>
                <p className="text-xs leading-relaxed">
                  This will permanently remove <strong>{demoCountInExisting} demo/sample records</strong> (those explicitly marked
                  <code className="mx-1 px-1 bg-amber-200 rounded font-mono text-[11px]">isDemo: true</code>)
                  and replace them with <strong>{previewSummary?.validRecords} official college records</strong> from your file.
                  Real records already in the system are NOT affected.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Demo to Remove',  value: demoCountInExisting,              color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
                  { label: 'Records to Import', value: previewSummary?.validRecords || 0, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                ].map(i => (
                  <div key={i.label} className={`rounded-xl border p-4 text-center ${i.bg}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{i.label}</span>
                    <span className={`text-2xl font-bold ${i.color}`}>{i.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ====== STEP 7: PROCESSING ====== */}
          {step === 'PROCESSING' && (
            <div className="py-16 text-center space-y-6">
              <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mx-auto" />
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{progressText}</h3>
                <p className="text-xs text-slate-400">{progress}% complete</p>
              </div>
              <div className="w-full max-w-sm mx-auto bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className="bg-blue-600 h-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* ====== STEP 8: RESULT ====== */}
          {step === 'RESULT' && importResult && (
            <div className="py-8 space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Import Complete!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{importResult.message}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left max-w-lg mx-auto">
                {[
                  { label: 'Created',      value: importResult.created,          color: 'text-emerald-600' },
                  { label: 'Updated',      value: importResult.updated,          color: 'text-blue-600' },
                  { label: 'Demo Removed', value: importResult.removedDemoCount, color: 'text-amber-600' },
                  { label: 'Total Active', value: existingACs.length,            color: 'text-slate-900' },
                ].map(i => (
                  <div key={i.label} className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">{i.label}</span>
                    <span className={`text-2xl font-bold ${i.color}`}>{i.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <RefreshCw size={11} /> Dashboard, charts, and all portal views have been refreshed.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 gap-3">

          {/* Back / Cancel */}
          <div>
            {step === 'SELECT_FILE' && (
              <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors">
                Cancel
              </button>
            )}
            {step === 'SELECT_WORKSHEET' && (
              <button onClick={handleReset} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors">
                ← Change File
              </button>
            )}
            {step === 'COLUMN_MAPPING' && (
              <button onClick={() => setStep(fileType === 'excel' && sheetNames.length > 1 ? 'SELECT_WORKSHEET' : 'SELECT_FILE')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors">
                ← Back
              </button>
            )}
            {step === 'PREVIEW' && (
              <button onClick={() => setStep('COLUMN_MAPPING')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors">
                ← Column Mapping
              </button>
            )}
            {step === 'SELECT_IMPORT_MODE' && (
              <button onClick={() => setStep('PREVIEW')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors">
                ← Preview
              </button>
            )}
            {step === 'CONFIRM_REPLACE' && (
              <button onClick={() => setStep('SELECT_IMPORT_MODE')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors">
                ← Back
              </button>
            )}
          </div>

          {/* Next / Primary action */}
          <div>
            {step === 'SELECT_WORKSHEET' && (
              <button
                onClick={handleSheetContinue}
                disabled={!selectedSheet || isLoading}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                Load Sheet <ArrowRight size={14} />
              </button>
            )}
            {step === 'COLUMN_MAPPING' && (
              <button
                onClick={handleApplyMapping}
                disabled={isLoading || rawRows.length === 0}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                Validate & Preview <ArrowRight size={14} />
              </button>
            )}
            {step === 'PREVIEW' && (
              <button
                onClick={() => setStep('SELECT_IMPORT_MODE')}
                disabled={(previewSummary?.validRecords || 0) === 0}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                Continue to Import Mode <ArrowRight size={14} />
              </button>
            )}
            {step === 'SELECT_IMPORT_MODE' && (
              <button
                onClick={() => {
                  if (importMode === 'replace') setStep('CONFIRM_REPLACE');
                  else handleExecuteImport();
                }}
                disabled={(previewSummary?.validRecords || 0) === 0}
                className={`flex items-center gap-1.5 px-5 py-2 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 ${
                  importMode === 'replace' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {importMode === 'replace' ? 'Proceed to Confirmation' : 'Confirm & Import'} <ArrowRight size={14} />
              </button>
            )}
            {step === 'CONFIRM_REPLACE' && (
              <button
                onClick={handleExecuteImport}
                className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 transition-colors shadow-sm"
              >
                Confirm Replace Demo Data <ShieldCheck size={14} />
              </button>
            )}
            {step === 'RESULT' && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// small utility
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

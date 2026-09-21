// src/components/features/csv-import/excel-parser.ts
// Unified file parser: .xlsx/.xls via SheetJS, .csv via PapaParse
// Reads the COMPLETE file — no row limit.

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export type ParsedFileData = {
  fileType: 'excel' | 'csv';
  fileName: string;
  fileSize: number;
  sheetNames: string[];            // Excel only; CSV = ['Sheet1']
  selectedSheet: string;
  headers: string[];               // ALL detected column headers
  rows: Record<string, string>[]; // ALL rows as key-value maps
  totalRows: number;
};

/** Detect the file category from its extension */
export function getFileCategory(file: File): 'excel' | 'csv' | 'unsupported' {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'excel';
  if (name.endsWith('.csv')) return 'csv';
  return 'unsupported';
}

/** Human-readable file type label */
export function getFileTypeLabel(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx')) return 'Excel Workbook (.xlsx)';
  if (name.endsWith('.xls')) return 'Excel 97-2003 Workbook (.xls)';
  if (name.endsWith('.csv')) return 'CSV Spreadsheet (.csv)';
  return 'Unknown';
}

/** Format bytes to human readable string */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Read only the sheet names from an Excel file without parsing all data.
 * Returns sheet names so the UI can let the user pick one.
 */
export async function readExcelSheetNames(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook.SheetNames);
      } catch (err) {
        reject(new Error('Unable to read Excel file.'));
      }
    };
    reader.onerror = () => reject(new Error('Unable to read Excel file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse a specific sheet from an Excel file.
 * Reads ALL rows and ALL columns — no truncation.
 */
export async function parseExcelSheet(
  file: File,
  sheetName: string
): Promise<{ headers: string[]; rows: Record<string, string>[]; totalRows: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
          reject(new Error(`Sheet "${sheetName}" not found in workbook.`));
          return;
        }

        // Convert to array of arrays to detect all rows/columns correctly
        const aoa: any[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          blankrows: false,
        });

        if (aoa.length === 0) {
          resolve({ headers: [], rows: [], totalRows: 0 });
          return;
        }

        // First row = headers; trim whitespace
        const rawHeaders: string[] = aoa[0].map((h: any) =>
          h !== null && h !== undefined ? String(h).trim() : ''
        );
        // Remove completely empty trailing header columns
        const lastNonEmpty = rawHeaders.reduceRight(
          (acc, h, i) => (acc === -1 && h !== '' ? i : acc),
          -1
        );
        const headers = lastNonEmpty >= 0 ? rawHeaders.slice(0, lastNonEmpty + 1) : rawHeaders;

        // Remaining rows = data
        const rows: Record<string, string>[] = [];
        for (let i = 1; i < aoa.length; i++) {
          const row = aoa[i];
          // Skip completely empty rows
          const allEmpty = row.every(
            (cell: any) => cell === null || cell === undefined || String(cell).trim() === ''
          );
          if (allEmpty) continue;

          const record: Record<string, string> = {};
          headers.forEach((h, idx) => {
            const cell = row[idx];
            if (cell instanceof Date) {
              // Format dates as YYYY-MM-DD
              record[h] = cell.toISOString().split('T')[0];
            } else {
              record[h] = cell !== null && cell !== undefined ? String(cell).trim() : '';
            }
          });
          rows.push(record);
        }

        resolve({ headers, rows, totalRows: rows.length });
      } catch (err: any) {
        reject(new Error('Unable to read Excel file.'));
      }
    };
    reader.onerror = () => reject(new Error('Unable to read Excel file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse a CSV file using PapaParse.
 * Reads the COMPLETE file — no row limit.
 */
export async function parseCSVFile(
  file: File
): Promise<{ headers: string[]; rows: Record<string, string>[]; totalRows: number }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h: string) => h.trim(),
      complete: (results: any) => {
        const headers: string[] = results.meta.fields || [];
        const rows: Record<string, string>[] = (results.data as any[]).map((row) => {
          const rec: Record<string, string> = {};
          headers.forEach((h) => {
            rec[h] = row[h] !== null && row[h] !== undefined ? String(row[h]).trim() : '';
          });
          return rec;
        });
        resolve({ headers, rows, totalRows: rows.length });
      },
      error: (err: any) => {
        reject(new Error(`Unable to read CSV file: ${err.message}`));
      },
    });
  });
}

/**
 * Master parser — auto-detects file type and returns a unified ParsedFileData object.
 * For Excel: reads sheet names only (caller picks the sheet, then calls parseSelectedSheet).
 * For CSV: parses immediately.
 */
export async function readFileMetadata(
  file: File
): Promise<{ fileType: 'excel' | 'csv'; sheetNames: string[] }> {
  const category = getFileCategory(file);
  if (category === 'unsupported') {
    throw new Error('Unsupported file type. Please upload a .xlsx, .xls, or .csv file.');
  }
  if (category === 'excel') {
    const sheetNames = await readExcelSheetNames(file);
    return { fileType: 'excel', sheetNames };
  }
  // CSV has a single implicit sheet
  return { fileType: 'csv', sheetNames: ['Sheet1'] };
}

/**
 * Parse all data from the selected sheet (or the only CSV sheet).
 */
export async function parseSelectedSheet(
  file: File,
  fileType: 'excel' | 'csv',
  sheetName: string
): Promise<{ headers: string[]; rows: Record<string, string>[]; totalRows: number }> {
  if (fileType === 'excel') {
    return parseExcelSheet(file, sheetName);
  }
  return parseCSVFile(file);
}

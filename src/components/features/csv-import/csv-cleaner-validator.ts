// src/components/features/csv-import/csv-cleaner-validator.ts
import Papa from 'papaparse';
import { ExtendedAC, ValidationProblem, CSVRowCleaned, ImportPreviewSummary, DuplicateRecord } from '@/lib/ac-data-service';

// ─── System Fields Definition ─────────────────────────────────────────────────
export const SYSTEM_FIELDS = [
  { key: 'AC_ID',                label: 'AC ID / Asset ID',                      required: false },
  { key: 'Building_ID',         label: 'Building ID',                            required: false },
  { key: 'Building_Name',       label: 'Building / Block Name',                  required: false },
  { key: 'Floor',               label: 'Floor (e.g., Floor 1)',                  required: false },
  { key: 'Room_ID',             label: 'Room ID',                                required: false },
  { key: 'Room_Name',           label: 'Room / Location Name',                   required: false },
  { key: 'Department',          label: 'Department Name',                        required: false },
  { key: 'AC_Type',             label: 'AC Type (Split/Window/Cassette/etc)',     required: false },
  { key: 'Brand',               label: 'Brand / Make',                           required: false },
  { key: 'Model',               label: 'Model Number',                           required: false },
  { key: 'Serial_Number',       label: 'Serial Number',                          required: false },
  { key: 'Capacity_Ton',        label: 'Capacity (Tons, e.g., 1.5 or 1.5 Ton)', required: false },
  { key: 'Status',              label: 'Status (Working/Fault/Maintenance)',     required: false },
  { key: 'Installation_Date',   label: 'Year of Purchase / Installation Date',   required: false },
  { key: 'Last_Maintenance_Date', label: 'Last Service Date',                    required: false },
  { key: 'Next_Service_Date',   label: 'Next Service Date',                      required: false },
  { key: 'Technician',          label: 'Assigned Technician',                    required: false },
  { key: 'Remarks',             label: 'Remarks / Notes',                        required: false },
];

// ─── CSV Template Download ────────────────────────────────────────────────────
export function generateCSVTemplate(): string {
  const headers = SYSTEM_FIELDS.map(f => f.key).join(',');
  const r1 = 'AC-101,BLK-001,Main Academic Block,Floor 1,ROOM-102,CSE Computer Lab 1,Computer Science,Split,Daikin,FTK50,DAI10001,1.5 Ton,Working,2022-01-15,2026-08-10,2026-11-10,Mr. Suresh Babu,Official College Record';
  const r2 = 'AC-102,BLK-001,Main Academic Block,Floor 1,ROOM-105,HOD Cabin,Administration,Window,Voltas,VW183,VLT20002,1.5 Ton,Working,2021-06-20,2026-07-05,2026-10-05,Mr. Karthik Rajan,Official College Record';
  const r3 = 'AC-103,BLK-002,ECE & IT Block,Floor 2,ROOM-204,DSP Research Lab,Electronics,Cassette,Blue Star,IC518,BS30003,2.0 Ton,Fault,2023-03-10,2026-09-01,2026-09-25,Mr. Suresh Babu,Maintenance required';
  return `${headers}\n${r1}\n${r2}\n${r3}`;
}

export function downloadCSVTemplate() {
  const content = generateCSVTemplate();
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'NITTTR_AC_Asset_Import_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── Auto Header Mapping ──────────────────────────────────────────────────────
// Covers standard system fields AND common college Excel column names.
export function autoMapHeaders(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};

  headers.forEach(h => {
    const c = h.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    let key = '';

    // AC ID / Asset ID
    if (c === 'acid' || c === 'assetid' || c === 'acid' || c === 'acno' || c === 'assetno') key = 'AC_ID';

    // Building
    else if (c === 'buildingid' || c === 'blockid') key = 'Building_ID';
    else if (c === 'buildingname' || c === 'blockname' || c === 'building' || c === 'block') key = 'Building_Name';

    // Floor
    else if (c.includes('floor') || c === 'storey' || c === 'level') key = 'Floor';

    // Room / Location
    else if (c === 'roomid') key = 'Room_ID';
    else if (
      c === 'roomname' || c === 'room' || c === 'location' || c === 'place' ||
      c === 'lab' || c === 'labname' || c === 'hallname' || c === 'areaname' ||
      c === 'installedroom' || c === 'installedlocation'
    ) key = 'Room_Name';

    // Department
    else if (c.includes('dept') || c.includes('department') || c === 'section') key = 'Department';

    // AC Type
    else if (c === 'actype' || c === 'type' || c === 'acmodel' || c === 'unittype') key = 'AC_Type';

    // Brand / Make
    else if (
      c === 'brand' || c === 'make' || c === 'manufacturer' ||
      c === 'nameofthebrand' || c === 'brandname' || c === 'acbrand' ||
      c === 'companyname' || c === 'company'
    ) key = 'Brand';

    // Model
    else if (c === 'model' || c === 'modelnumber' || c === 'modelno') key = 'Model';

    // Serial Number
    else if (
      c.includes('serial') || c === 'sn' || c === 'serialno' ||
      c === 'serialnumber' || c === 'snumber'
    ) key = 'Serial_Number';

    // Capacity
    else if (
      c === 'capacity' || c.includes('ton') || c === 'capacityinton' ||
      c === 'capacityton' || c === 'actons' || c === 'rating'
    ) key = 'Capacity_Ton';

    // Status
    else if (c === 'status' || c === 'condition' || c === 'workingstatus') key = 'Status';

    // Installation / Purchase Year
    else if (
      c.includes('instal') || c === 'yearofpurchase' || c === 'purchaseyear' ||
      c === 'year' || c === 'purchasedate' || c === 'yop' || c === 'yearofinstallation'
    ) key = 'Installation_Date';

    // Last maintenance
    else if (
      c.includes('lastmaint') || c.includes('lastservice') ||
      c === 'lastserviceddate' || c === 'previousservice'
    ) key = 'Last_Maintenance_Date';

    // Next maintenance
    else if (
      c.includes('nextmaint') || c.includes('nextservice') ||
      c === 'scheduledservice' || c === 'dudate'
    ) key = 'Next_Service_Date';

    // Technician
    else if (c.includes('tech') || c.includes('engineer') || c === 'assignedto') key = 'Technician';

    // Remarks
    else if (c.includes('remark') || c.includes('note') || c === 'comment' || c === 'description') key = 'Remarks';

    if (key) map[h] = key;
  });

  return map;
}

// ─── Normalize Helpers ────────────────────────────────────────────────────────
export function normalizeStatus(raw: string): { status: 'Working' | 'Fault' | 'Maintenance' | 'Offline'; problem?: string } {
  const s = raw.trim().toLowerCase();
  if (['working', 'operational', 'ok', 'active', 'good', 'online', 'functional'].includes(s)) return { status: 'Working' };
  if (['fault', 'faulty', 'defect', 'damaged', 'broken', 'error', 'not working', 'notworking'].includes(s)) return { status: 'Fault' };
  if (['maintenance', 'under maintenance', 'servicing', 'repair', 'under repair'].includes(s)) return { status: 'Maintenance' };
  if (['offline', 'inactive', 'deactivated', 'removed', 'retired', 'unknown', ''].includes(s)) return { status: 'Offline' };
  return { status: 'Offline', problem: `Unknown status "${raw}" → normalized to "Offline"` };
}

export function normalizeAcType(raw: string): { type: string; problem?: string } {
  const t = raw.trim().toLowerCase();
  if (t.includes('split')) return { type: 'Split' };
  if (t.includes('window')) return { type: 'Window' };
  if (t.includes('cassette')) return { type: 'Cassette' };
  if (t.includes('duct')) return { type: 'Ductable' };
  if (t.includes('central') || t.includes('chiller') || t.includes('vrf') || t.includes('vrv')) return { type: 'Central' };
  if (t === '') return { type: 'Split' };
  return { type: raw.trim(), problem: `Custom AC type "${raw}" kept as-is` };
}

// ─── Main Validation & Cleaning Function ──────────────────────────────────────
export async function parseAndCleanRows(
  rawRows: Record<string, string>[],
  headers: string[],
  mapping: Record<string, string>,
  existingDataset: ExtendedAC[]
): Promise<{
  rows: CSVRowCleaned[];
  summary: ImportPreviewSummary;
  duplicates: DuplicateRecord[];
  allProblems: ValidationProblem[];
}> {
  const rows: CSVRowCleaned[] = [];
  const allProblems: ValidationProblem[] = [];
  const duplicates: DuplicateRecord[] = [];

  // Existing ID sets for duplicate detection
  const existingAcIdMap = new Map(existingDataset.map(a => [a.id.toLowerCase(), a]));
  const existingSerialMap = new Map(existingDataset.filter(a => a.serialNumber).map(a => [a.serialNumber.toLowerCase(), a]));

  // Within-file tracking
  const seenAcIds = new Map<string, number>(); // ac_id → first row index
  const seenSerials = new Map<string, number>(); // serial → first row index

  let validCount = 0, newCount = 0, updateCount = 0, duplicateCount = 0, invalidCount = 0, emptyCount = 0;

  // Auto-generate AC IDs if AC_ID column isn't mapped
  const acIdMapped = Object.values(mapping).includes('AC_ID');
  let autoIdCounter = 1;

  rawRows.forEach((rawRow, idx) => {
    const rowNum = idx + 2; // 1-indexed + header row
    const problems: ValidationProblem[] = [];

    // Skip completely empty rows
    const allEmpty = Object.values(rawRow).every(v => v.trim() === '');
    if (allEmpty) { emptyCount++; return; }

    // Helper: get value by system key
    const get = (sysKey: string): string => {
      const col = Object.keys(mapping).find(c => mapping[c] === sysKey);
      return col ? (rawRow[col] || '').trim() : '';
    };

    // Extract values (with smart defaults)
    let rawAcId        = get('AC_ID');
    const rawBuildingId   = get('Building_ID')   || 'BLK-001';
    const rawBuildingName = get('Building_Name') || rawBuildingId;
    const rawFloor        = get('Floor')         || 'Ground Floor';
    const rawRoomId       = get('Room_ID')       || `ROOM-${String(idx + 1).padStart(3, '0')}`;
    const rawRoomName     = get('Room_Name')     || rawRoomId;
    const rawDept         = get('Department')    || 'General';
    const rawType         = get('AC_Type')       || '';
    const rawBrand        = get('Brand')         || 'Generic';
    const rawModel        = get('Model')         || 'Standard';
    const rawSerial       = get('Serial_Number') || '';
    const rawCapacity     = get('Capacity_Ton')  || '1.5';
    const rawStatus       = get('Status')        || '';
    const rawInstDate     = get('Installation_Date') || '';
    const rawLastMaint    = get('Last_Maintenance_Date') || '';
    const rawNextMaint    = get('Next_Service_Date')    || '';
    const rawTech         = get('Technician')    || 'Central Maintenance';
    const rawRemarks      = get('Remarks')       || 'Imported College Record';

    // Auto-generate AC_ID if not present
    if (!rawAcId) {
      rawAcId = `IMPORT-${String(autoIdCounter++).padStart(4, '0')}`;
    }

    // Normalize values
    const normStatus = normalizeStatus(rawStatus || 'Working');
    if (normStatus.problem) {
      problems.push({ row: rowNum, field: 'Status', problem: normStatus.problem, action: 'Normalized', severity: 'warning' });
    }
    const normType = normalizeAcType(rawType);
    if (normType.problem) {
      problems.push({ row: rowNum, field: 'AC_Type', problem: normType.problem, action: 'Normalized', severity: 'info' });
    }

    // Normalize capacity — strip "Ton", parse number
    const capacityNumStr = rawCapacity.replace(/[^0-9.]/g, '');
    const capacityNum = parseFloat(capacityNumStr) || 1.5;
    const capacityDisplay = `${capacityNum} Ton`;

    // Normalize installation date — handle plain year (e.g., "2025")
    let installDate = rawInstDate;
    if (/^\d{4}$/.test(installDate)) installDate = `${installDate}-01-01`;

    // ── Duplicate Detection (ONLY by AC_ID or Serial Number) ──────────────────
    let rowStatus: 'CREATE' | 'UPDATE' | 'DUPLICATE' | 'INVALID' | 'SKIP' = 'CREATE';
    const acIdLower = rawAcId.toLowerCase();
    const serialLower = rawSerial.toLowerCase();

    // Check within-file AC_ID duplicate (only if AC_ID column was actually mapped)
    if (acIdMapped && seenAcIds.has(acIdLower)) {
      rowStatus = 'DUPLICATE';
      problems.push({
        row: rowNum, field: 'AC_ID',
        problem: `Duplicate AC_ID "${rawAcId}" in file (first seen row ${seenAcIds.get(acIdLower)})`,
        action: 'Review required', severity: 'error'
      });
      duplicateCount++;
    }
    // Check within-file Serial duplicate (only if serial exists)
    else if (rawSerial && seenSerials.has(serialLower)) {
      rowStatus = 'DUPLICATE';
      problems.push({
        row: rowNum, field: 'Serial_Number',
        problem: `Duplicate Serial "${rawSerial}" in file (first seen row ${seenSerials.get(serialLower)})`,
        action: 'Review required', severity: 'warning'
      });
      duplicateCount++;
    }
    // Check against existing DB
    else if (acIdMapped && existingAcIdMap.has(acIdLower)) {
      rowStatus = 'UPDATE';
      updateCount++;
      const existingRec = existingAcIdMap.get(acIdLower);
      duplicates.push({ acId: rawAcId, serialNumber: rawSerial, existingRecord: existingRec, incomingRow: {} as any, conflictReason: 'Exact AC ID Match' });
    }
    else if (rawSerial && existingSerialMap.has(serialLower)) {
      rowStatus = 'UPDATE';
      updateCount++;
      const existingRec = existingSerialMap.get(serialLower);
      duplicates.push({ acId: rawAcId, serialNumber: rawSerial, existingRecord: existingRec, incomingRow: {} as any, conflictReason: 'Serial Number Match' });
    }
    else {
      rowStatus = 'CREATE';
      newCount++;
    }

    // Track seen identifiers
    if (acIdMapped) seenAcIds.set(acIdLower, rowNum);
    if (rawSerial) seenSerials.set(serialLower, rowNum);

    if (rowStatus !== 'DUPLICATE') validCount++;

    // Build cleaned AC record
    const cleanedAC: Partial<ExtendedAC> = {
      id: rawAcId,
      make: rawBrand,
      model: rawModel,
      type: normType.type,
      capacity: capacityDisplay,
      capacityTon: capacityNum,
      serialNumber: rawSerial,
      status: normStatus.status,
      installationDate: installDate,
      installationYear: installDate ? installDate.split('-')[0] : '',
      lastMaintenanceDate: rawLastMaint,
      nextMaintenanceDate: rawNextMaint,
      technician: rawTech,
      remarks: rawRemarks,
      buildingName: rawBuildingName,
      floorName: rawFloor,
      roomName: rawRoomName,
      departmentName: rawDept,
      location: {
        buildingId: rawBuildingId,
        floorId: `${rawBuildingId}-${rawFloor.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        roomId: rawRoomId,
        departmentId: rawDept.toLowerCase().replace(/[^a-z0-9]/g, ''),
      },
      isDemo: false,
    };

    const rowItem: CSVRowCleaned = {
      rowIndex: rowNum,
      raw: rawRow,
      cleaned: cleanedAC,
      status: rowStatus,
      problems,
    };

    if (rowStatus === 'UPDATE') {
      const dup = duplicates.find(d => d.acId.toLowerCase() === acIdLower || (rawSerial && d.serialNumber?.toLowerCase() === serialLower));
      if (dup) dup.incomingRow = rowItem;
    }

    rows.push(rowItem);
    allProblems.push(...problems);
  });

  const summary: ImportPreviewSummary = {
    totalRows: rawRows.length,
    validRecords: validCount,
    newRecords: newCount,
    updatesCount: updateCount,
    duplicatesCount: duplicateCount,
    invalidRecords: invalidCount,
    emptyRows: emptyCount,
    missingRequiredFields: 0,
  };

  return { rows, summary, duplicates, allProblems };
}

// ─── Legacy CSV wrapper (kept for backward compat) ────────────────────────────

export async function parseAndCleanCSV(
  file: File,
  customMapping?: Record<string, string>,
  existingDataset: ExtendedAC[] = []
): Promise<{
  rows: CSVRowCleaned[];
  summary: ImportPreviewSummary;
  duplicates: DuplicateRecord[];
  allProblems: ValidationProblem[];
  headers: string[];
}> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h: string) => h.trim(),
      complete: async (results: any) => {
        try {
          const headers: string[] = results.meta.fields || [];
          const rawRows: Record<string, string>[] = (results.data as any[]).map((row: any) => {
            const rec: Record<string, string> = {};
            headers.forEach(h => { rec[h] = row[h] !== null && row[h] !== undefined ? String(row[h]).trim() : ''; });
            return rec;
          });
          const mapping = customMapping || autoMapHeaders(headers);
          const parsed = await parseAndCleanRows(rawRows, headers, mapping, existingDataset);
          resolve({ ...parsed, headers });
        } catch (e: any) {
          reject(e);
        }
      },
      error: (err: any) => reject(new Error(`Unable to read CSV file: ${err.message}`)),
    });
  });
}

// ─── Validation Report Download ───────────────────────────────────────────────
export function downloadValidationReport(problems: ValidationProblem[]) {
  if (problems.length === 0) {
    alert('No validation issues detected! Dataset is 100% clean.');
    return;
  }
  const csvRows = ['Row,Field,Problem,Action,Severity'];
  problems.forEach(p => {
    csvRows.push(`${p.row},"${p.field}","${p.problem.replace(/"/g, '""')}","${p.action}",${p.severity}`);
  });
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Validation_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

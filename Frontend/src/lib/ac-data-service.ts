// src/lib/ac-data-service.ts
import { AcStatus, LocationData } from './types/campus';
// Real service layer is used by campus-services.ts; no direct imports needed here

export interface ExtendedAC {
  id: string; // AC ID
  make: string; // Brand
  model: string;
  capacity: string; // e.g., "1.5 Ton"
  capacityTon?: number; // e.g., 1.5
  serialNumber: string;
  type: string; // e.g., "Split", "Window", "Cassette", "Central", "Ductable"
  manufacturingYear?: string;
  installationYear?: string;
  installationDate?: string;
  starRating?: string;
  powerRating?: string;
  powerFactor?: string;
  status: AcStatus; // 'Working' | 'Fault' | 'Maintenance' | 'Offline' | 'Unknown'
  lastMaintenanceType?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  technician?: string;
  remarks?: string;
  location: LocationData;
  buildingName?: string;
  floorName?: string;
  roomName?: string;
  departmentName?: string;
  isDemo: boolean; // CRITICAL METADATA: Explicitly marks whether record is demo/sample data
  createdAt?: string;
  updatedAt?: string;
}

export interface ACFilters {
  search?: string;
  buildingId?: string;
  floorId?: string;
  departmentId?: string;
  acType?: string;
  status?: string;
  dateRange?: { start?: string; end?: string };
}

export interface ACStatistics {
  total: number;
  working: number;
  faulty: number;
  underMaintenance: number;
  inactive: number;
  dueForMaintenance: number;
  overdue: number;
  isDemoData: boolean;
  installedCapacity: number;
  departmentsCount: number;
  locationsCount: number;
  dataCompletenessPct: number;
}

export interface DataSourceStatus {
  isDemo: boolean;
  label: 'Demo Data' | 'Official College Dataset';
  demoCount: number;
  realCount: number;
  totalCount: number;
  lastImportDate?: string;
}

export interface CSVRowCleaned {
  rowIndex: number;
  raw: Record<string, string>;
  cleaned: Partial<ExtendedAC>;
  status: 'CREATE' | 'UPDATE' | 'DUPLICATE' | 'INVALID' | 'SKIP';
  problems: ValidationProblem[];
  duplicateRef?: string;
}

export interface ValidationProblem {
  row: number;
  field: string;
  problem: string;
  action: 'Invalid' | 'Normalized' | 'Review required' | 'Missing';
  severity: 'error' | 'warning' | 'info';
}

export interface DuplicateRecord {
  acId: string;
  serialNumber?: string;
  existingRecord?: ExtendedAC;
  incomingRow: CSVRowCleaned;
  conflictReason: 'Exact AC ID Match' | 'Serial Number Match' | 'Duplicate in File';
}

export interface ImportPreviewSummary {
  totalRows: number;
  validRecords: number;
  newRecords: number;
  updatesCount: number;
  duplicatesCount: number;
  invalidRecords: number;
  emptyRows: number;
  missingRequiredFields: number;
}

export interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  invalid: number;
  removedDemoCount: number;
  message: string;
  timestamp: string;
}

// Default initial dataset enriched with explicit isDemo flag & campus details
// Default initial dataset is empty for real data
const INITIAL_DEMO_DATASET: ExtendedAC[] = [];

// Additional initial demo ACs to populate rich charts
const ADDITIONAL_DEMO_ACS: ExtendedAC[] = [
  {
    id: 'AC-130',
    make: 'Voltas',
    model: 'VW183PC',
    capacity: '1.5 Ton',
    capacityTon: 1.5,
    serialNumber: 'VLT98765',
    type: 'Window',
    manufacturingYear: '2020',
    installationYear: '2021',
    installationDate: '2021-03-15',
    starRating: '3',
    powerRating: '1.6 kW',
    powerFactor: '0.90',
    status: 'Offline',
    lastMaintenanceType: 'Repair',
    lastMaintenanceDate: '2025-07-15',
    nextMaintenanceDate: '2026-10-01',
    technician: 'Mr. Karthik Rajan',
    remarks: 'Compressor check pending',
    location: { buildingId: 'BLK-004', floorId: 'BLK-004-FLR-0', departmentId: 'DEPT-003', roomId: 'ROOM-010' },
    buildingName: 'Admin Block',
    floorName: 'Ground Floor',
    roomName: 'Director Office',
    departmentName: 'Administration',
    isDemo: true
  },
  {
    id: 'AC-131',
    make: 'Blue Star',
    model: 'IC518DATU',
    capacity: '2.0 Ton',
    capacityTon: 2.0,
    serialNumber: 'BS112233',
    type: 'Split',
    manufacturingYear: '2023',
    installationYear: '2023',
    installationDate: '2023-08-10',
    starRating: '5',
    powerRating: '1.85 kW',
    powerFactor: '0.95',
    status: 'Working',
    lastMaintenanceType: 'Preventive',
    lastMaintenanceDate: '2026-09-01',
    nextMaintenanceDate: '2026-12-01',
    technician: 'Mr. Suresh Babu',
    remarks: 'Serviced regularly',
    location: { buildingId: 'BLK-003', floorId: 'BLK-003-FLR-2', departmentId: 'DEPT-002', roomId: 'ROOM-004' },
    buildingName: 'Training & Labs Block C',
    floorName: 'Floor 2',
    roomName: 'Seminar Hall',
    departmentName: 'Mechanical Department',
    isDemo: true
  },
  {
    id: 'AC-132',
    make: 'Daikin',
    model: 'ATKL50',
    capacity: '2.0 Ton',
    capacityTon: 2.0,
    serialNumber: 'DAI990011',
    type: 'Cassette',
    manufacturingYear: '2022',
    installationYear: '2022',
    installationDate: '2022-05-20',
    starRating: '4',
    powerRating: '1.95 kW',
    powerFactor: '0.92',
    status: 'Fault',
    lastMaintenanceType: 'Emergency',
    lastMaintenanceDate: '2026-09-10',
    nextMaintenanceDate: '2026-09-22',
    technician: 'Mr. Suresh Babu',
    remarks: 'Blower fan vibration issue',
    location: { buildingId: 'BLK-006', floorId: 'BLK-006-FLR-0', departmentId: 'DEPT-005', roomId: 'ROOM-007' },
    buildingName: 'Auditorium',
    floorName: 'Ground Floor',
    roomName: 'Main Stage AC',
    departmentName: 'Cultural Committee',
    isDemo: true
  },
  {
    id: 'AC-133',
    make: 'Carrier',
    model: 'Superia 3 Star',
    capacity: '1.0 Ton',
    capacityTon: 1.0,
    serialNumber: 'CAR554433',
    type: 'Split',
    manufacturingYear: '2023',
    installationYear: '2023',
    installationDate: '2023-01-15',
    starRating: '3',
    powerRating: '1.1 kW',
    powerFactor: '0.90',
    status: 'Working',
    lastMaintenanceType: 'Preventive',
    lastMaintenanceDate: '2026-08-10',
    nextMaintenanceDate: '2026-11-10',
    technician: 'Mr. Karthik Rajan',
    remarks: 'Working smoothly',
    location: { buildingId: 'BLK-007', floorId: 'BLK-007-FLR-0', departmentId: 'DEPT-007', roomId: 'ROOM-015' },
    buildingName: 'Computer Centre',
    floorName: 'Ground Floor',
    roomName: 'Server Room 1',
    departmentName: 'IT Services',
    isDemo: true
  },
  {
    id: 'AC-134',
    make: 'Hitachi',
    model: 'Kashikoi 5100x',
    capacity: '3.0 Ton',
    capacityTon: 3.0,
    serialNumber: 'HIT778899',
    type: 'Ductable',
    manufacturingYear: '2021',
    installationYear: '2022',
    installationDate: '2022-09-01',
    starRating: '5',
    powerRating: '2.8 kW',
    powerFactor: '0.96',
    status: 'Maintenance',
    lastMaintenanceType: 'Repair',
    lastMaintenanceDate: '2026-09-18',
    nextMaintenanceDate: '2026-09-25',
    technician: 'Mr. Suresh Babu',
    remarks: 'Duct cleaning and coil repair in progress',
    location: { buildingId: 'BLK-005', floorId: 'BLK-005-FLR-0', departmentId: 'DEPT-008', roomId: 'ROOM-020' },
    buildingName: 'Library',
    floorName: 'Ground Floor',
    roomName: 'Central Reading Room',
    departmentName: 'Library Staff',
    isDemo: true
  }
];

const INITIAL_FULL_DATASET = [...INITIAL_DEMO_DATASET, ...ADDITIONAL_DEMO_ACS];

// In-Memory Storage & Subscriber System
class ACDatabaseStore {
  private acs: ExtendedAC[] = [];
  private listeners: Set<() => void> = new Set();
  private lastImportDate?: string;

  constructor() {
    this.initStore();
  }

  private initStore() {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('nitttr_ac_active_dataset');
        const cachedDate = localStorage.getItem('nitttr_ac_last_import_date');
        if (cached) {
          this.acs = JSON.parse(cached);
          if (cachedDate) this.lastImportDate = cachedDate;
          return;
        }
      } catch (e) {
        console.error('Error loading AC dataset from localStorage:', e);
      }
    }
    // Initialize store with empty dataset (real data will be loaded via API)
this.acs = [];
  }

  private persistStore() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nitttr_ac_active_dataset', JSON.stringify(this.acs));
        if (this.lastImportDate) {
          localStorage.setItem('nitttr_ac_last_import_date', this.lastImportDate);
        }
      } catch (e) {
        console.error('Error persisting AC dataset to localStorage:', e);
      }
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  // Get active dataset with optional filters
  public getActiveACDataset(filters?: ACFilters): ExtendedAC[] {
    let result = [...this.acs];

    if (!filters) return result;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(ac => 
        ac.id.toLowerCase().includes(q) ||
        ac.serialNumber.toLowerCase().includes(q) ||
        ac.make.toLowerCase().includes(q) ||
        ac.model.toLowerCase().includes(q) ||
        (ac.buildingName && ac.buildingName.toLowerCase().includes(q)) ||
        ac.location.buildingId.toLowerCase().includes(q) ||
        (ac.roomName && ac.roomName.toLowerCase().includes(q)) ||
        ac.location.roomId.toLowerCase().includes(q)
      );
    }

    if (filters.buildingId && filters.buildingId !== 'All') {
      result = result.filter(ac => ac.location.buildingId === filters.buildingId || ac.buildingName === filters.buildingId);
    }

    if (filters.floorId && filters.floorId !== 'All') {
      result = result.filter(ac => ac.location.floorId === filters.floorId || ac.floorName === filters.floorId);
    }

    if (filters.acType && filters.acType !== 'All') {
      result = result.filter(ac => ac.type.toLowerCase() === filters.acType?.toLowerCase());
    }

    if (filters.status && filters.status !== 'All') {
      result = result.filter(ac => ac.status.toLowerCase() === filters.status?.toLowerCase());
    }

    return result;
  }

  // Data Source Status indicator helper
  public getDataSourceStatus(): DataSourceStatus {
    const demoCount = this.acs.filter(ac => ac.isDemo).length;
    const realCount = this.acs.filter(ac => !ac.isDemo).length;
    const isDemo = realCount === 0;

    return {
      isDemo,
      label: isDemo ? 'Demo Data' : 'Official College Dataset',
      demoCount,
      realCount,
      totalCount: this.acs.length,
      lastImportDate: this.lastImportDate
    };
  }

  // Compute Statistics dynamically
  public getACStatistics(filters?: ACFilters): ACStatistics {
    const dataset = this.getActiveACDataset(filters);

    const working = dataset.filter(a => a.status === 'Working').length;
    const faulty = dataset.filter(a => a.status === 'Fault').length;
    const underMaintenance = dataset.filter(a => a.status === 'Maintenance').length;
    const inactive = dataset.filter(a => a.status === 'Offline' || a.status === 'Unknown').length;

    // Calculate due/overdue
    const todayStr = new Date().toISOString().split('T')[0];
    let dueForMaintenance = 0;
    let overdue = 0;
    let installedCapacity = 0;
    const departments = new Set<string>();
    const locations = new Set<string>();
    let totalFields = 0;
    let filledFields = 0;

    dataset.forEach(ac => {
      if (ac.nextMaintenanceDate) {
        if (ac.nextMaintenanceDate < todayStr && ac.status !== 'Working') {
          overdue++;
        } else if (ac.nextMaintenanceDate >= todayStr) {
          dueForMaintenance++;
        }
      }
      
      // Capacity
      if (ac.capacityTon) {
        installedCapacity += ac.capacityTon;
      }

      // Departments & Locations
      if (ac.departmentName) {
        departments.add(ac.departmentName);
      } else if (ac.location?.departmentId) {
        departments.add(ac.location.departmentId);
      }

      if (ac.roomName) {
        locations.add(ac.roomName);
      } else if (ac.location?.roomId) {
        locations.add(ac.location.roomId);
      }

      // Data Completeness check (checking some key fields)
      const fieldsToCheck = [
        ac.make, ac.model, ac.capacity, ac.serialNumber, ac.type, 
        ac.installationYear, ac.starRating, ac.buildingName, ac.departmentName
      ];
      totalFields += fieldsToCheck.length;
      filledFields += fieldsToCheck.filter(Boolean).length;
    });

    const isDemoData = dataset.some(ac => ac.isDemo);
    const dataCompletenessPct = totalFields === 0 ? 0 : Math.round((filledFields / totalFields) * 100);

    return {
      total: dataset.length,
      working,
      faulty,
      underMaintenance,
      inactive,
      dueForMaintenance,
      overdue,
      isDemoData,
      installedCapacity,
      departmentsCount: departments.size,
      locationsCount: locations.size,
      dataCompletenessPct
    };
  }

  // Chart aggregations
  public getACStatusDistribution(filters?: ACFilters) {
    const stats = this.getACStatistics(filters);
    return [
      { name: 'Working', value: stats.working, color: '#10B981' }, // Emerald
      { name: 'Faulty', value: stats.faulty, color: '#F43F5E' }, // Rose Neon
      { name: 'Under Maintenance', value: stats.underMaintenance, color: '#F59E0B' }, // Amber Amber
      { name: 'Inactive', value: stats.inactive, color: '#6366F1' }, // Indigo Vibrant
    ].filter(item => item.value > 0);
  }

  public getACTypeDistribution(filters?: ACFilters) {
    const dataset = this.getActiveACDataset(filters);
    const map = new Map<string, number>();

    dataset.forEach(ac => {
      const type = ac.type || 'Other';
      map.set(type, (map.get(type) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }

  public getBuildingDistribution(filters?: ACFilters) {
    const dataset = this.getActiveACDataset(filters);
    const map = new Map<string, number>();

    dataset.forEach(ac => {
      const building = ac.buildingName || ac.location.buildingId || 'Unassigned';
      map.set(building, (map.get(building) || 0) + 1);
    });

    return Array.from(map.entries()).map(([building, count]) => ({ building, count }));
  }

  public getACCapacityDistribution(filters?: ACFilters) {
    const dataset = this.getActiveACDataset(filters);
    const map = new Map<string, number>();

    dataset.forEach(ac => {
      const capacity = ac.capacity || 'Unknown';
      map.set(capacity, (map.get(capacity) || 0) + 1);
    });

    return Array.from(map.entries()).map(([capacity, count]) => ({ capacity, count }));
  }

  // Import New ACs (Add Mode)
  public async importACAssets(newACs: ExtendedAC[]): Promise<ImportResult> {
    const now = new Date().toISOString().split('T')[0];
    let created = 0;
    let updated = 0;

    const existingMap = new Map(this.acs.map(a => [a.id, a]));

    newACs.forEach(incoming => {
      // Mark as real dataset record
      incoming.isDemo = false;
      incoming.updatedAt = now;

      if (existingMap.has(incoming.id)) {
        // Update existing
        const idx = this.acs.findIndex(a => a.id === incoming.id);
        if (idx !== -1) {
          this.acs[idx] = { ...this.acs[idx], ...incoming };
          updated++;
        }
      } else {
        // Create new
        incoming.createdAt = now;
        this.acs.push(incoming);
        created++;
      }
    });

    this.lastImportDate = now;
    this.persistStore();

    return {
      success: true,
      created,
      updated,
      skipped: 0,
      invalid: 0,
      removedDemoCount: 0,
      message: `Successfully imported ${created} new record(s) and updated ${updated} record(s).`,
      timestamp: now
    };
  }

  // Replace Demo Data Workflow
  public async replaceDemoACAssets(newACs: ExtendedAC[]): Promise<ImportResult> {
    const now = new Date().toISOString().split('T')[0];

    // CRITICAL SAFETY RULE: Only remove records explicitly marked isDemo: true!
    const initialDemoCount = this.acs.filter(a => a.isDemo).length;
    const realRecordsToKeep = this.acs.filter(a => !a.isDemo);

    // Prepare incoming real records with isDemo = false
    const sanitizedIncoming: ExtendedAC[] = newACs.map(ac => ({
      ...ac,
      isDemo: false,
      createdAt: ac.createdAt || now,
      updatedAt: now
    }));

    // Replace dataset: Keep existing real records + append new real records
    this.acs = [...realRecordsToKeep, ...sanitizedIncoming];
    this.lastImportDate = now;
    this.persistStore();

    return {
      success: true,
      created: sanitizedIncoming.length,
      updated: 0,
      skipped: 0,
      invalid: 0,
      removedDemoCount: initialDemoCount,
      message: `Successfully replaced ${initialDemoCount} demo record(s) with ${sanitizedIncoming.length} official college asset record(s).`,
      timestamp: now
    };
  }

  // Update a single AC asset in real-time
  public updateACAsset(acId: string, updates: Partial<ExtendedAC>): ExtendedAC | null {
    const idx = this.acs.findIndex(a => a.id === acId);
    if (idx === -1) return null;

    const now = new Date().toISOString().split('T')[0];
    const updatedRecord: ExtendedAC = {
      ...this.acs[idx],
      ...updates,
      updatedAt: now
    };

    // Building name resolution: caller should supply buildingName in updates if needed
    // (mockBuildings removed — no local lookup available)

    this.acs[idx] = updatedRecord;
    this.persistStore();
    return updatedRecord;
  }

  // Reset back to initial demo dataset (For testing / reset purposes)
  public resetToDemoData() {
    this.acs = [...INITIAL_FULL_DATASET];
    this.lastImportDate = undefined;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nitttr_ac_active_dataset');
      localStorage.removeItem('nitttr_ac_last_import_date');
    }
    this.notify();
  }
}

// Global Singleton Instance
export const acStore = new ACDatabaseStore();

import { Building, Floor, Department, Room, AC } from './types/campus';

export const mockBuildings: Building[] = [
  { id: 'BLK-001', name: 'Academic Block A', type: 'Academic', layout: { x: -8, y: -2, w: 4, h: 4, color: '#f59e0b' } },
  { id: 'BLK-002', name: 'Academic Block B', type: 'Academic', layout: { x: -3, y: -2, w: 5, h: 3, color: '#f59e0b' } },
  { id: 'BLK-003', name: 'Training & Labs Block C', type: 'Academic', layout: { x: 3, y: -1, w: 5, h: 5, color: '#f59e0b' } },
  { id: 'BLK-004', name: 'Admin Block', type: 'Administrative', layout: { x: -8, y: 3, w: 4, h: 3, color: '#3b82f6' } },
  { id: 'BLK-005', name: 'Library', type: 'Library', layout: { x: -3, y: 3, w: 4, h: 2.5, color: '#a855f7' } },
  { id: 'BLK-006', name: 'Auditorium', type: 'Cultural', layout: { x: 3, y: 4, w: 4, h: 3, color: '#eab308' } },
  { id: 'BLK-007', name: 'Computer Centre', type: 'IT', layout: { x: -3, y: 7, w: 3, h: 2, color: '#14b8a6' } },
  { id: 'BLK-008', name: 'Innovation & Incubation Centre', type: 'R&D', layout: { x: 0.5, y: 7, w: 2, h: 2, color: '#ef4444' } },
  { id: 'BLK-009', name: 'Staff Quarters', type: 'Residential', layout: { x: -5, y: -6, w: 4, h: 2, color: '#d946ef' } },
  { id: 'BLK-010', name: 'Hostel', type: 'Residential', layout: { x: 5, y: -7, w: 3, h: 4, color: '#38bdf8' } },
  { id: 'BLK-011', name: 'Canteen', type: 'Food & Beverages', layout: { x: 8, y: 5, w: 3, h: 2, color: '#f43f5e' } },
  { id: 'BLK-012', name: 'Maintenance Workshop', type: 'Service', layout: { x: 9, y: 7.5, w: 3, h: 2, color: '#94a3b8' } },
  { id: 'BLK-013', name: 'Indoor Sports Hall', type: 'Sports', layout: { x: 2, y: -6, w: 2, h: 3, color: '#818cf8' } },
  { id: 'BLK-014', name: 'Sports Ground', type: 'Sports', layout: { x: -2, y: -6.5, w: 4, h: 3, color: '#22c55e' } },
];

export const mockFloors: Floor[] = [
  ...mockBuildings.flatMap(b => {
    // Generate floors 0 to 3 for each building for mock sake
    return [0, 1, 2, 3].map(level => ({
      id: `${b.id}-FLR-${level}`,
      name: level === 0 ? 'Ground Floor' : `Floor ${level}`,
      buildingId: b.id
    }));
  })
];

export const mockDepartments: Department[] = [
  { id: 'DEPT-001', name: 'CSE Department', floorId: 'BLK-001-FLR-2' },
  { id: 'DEPT-002', name: 'Mechanical Department', floorId: 'BLK-002-FLR-1' },
];

export const mockRooms: Room[] = [
  { id: 'ROOM-001', name: 'AI / ML LAB', type: 'Lab', floorId: 'BLK-001-FLR-2' }, // Map directly to floor to simplify for departments.
  { id: 'ROOM-002', name: 'Advanced Computing Lab', type: 'Lab', floorId: 'BLK-001-FLR-2' },
  { id: 'ROOM-003', name: 'Staff Room 201', type: 'Office', floorId: 'BLK-001-FLR-2' },
];

export const mockACs: AC[] = [
  {
    id: 'AC-127',
    make: 'Daikin',
    model: 'FTKF50',
    capacity: '1.5 Ton',
    serialNumber: 'DAI123456',
    type: 'Split',
    manufacturingYear: '2024',
    installationYear: '2024',
    starRating: '5',
    powerRating: '1.42 kW',
    powerFactor: '0.95',
    status: 'Working',
    lastMaintenanceType: 'Preventive',
    lastMaintenanceDate: '10-Aug-2026',
    location: {
      buildingId: 'BLK-001',
      floorId: 'BLK-001-FLR-2',
      departmentId: 'DEPT-001',
      roomId: 'ROOM-001'
    }
  },
  {
    id: 'AC-128',
    make: 'Daikin',
    model: 'FTKF50',
    capacity: '1.5 Ton',
    serialNumber: 'DAI123457',
    type: 'Split',
    manufacturingYear: '2024',
    installationYear: '2024',
    starRating: '5',
    powerRating: '1.42 kW',
    powerFactor: '0.95',
    status: 'Working',
    lastMaintenanceType: 'Preventive',
    lastMaintenanceDate: '10-Aug-2026',
    location: {
      buildingId: 'BLK-001',
      floorId: 'BLK-001-FLR-2',
      departmentId: 'DEPT-001',
      roomId: 'ROOM-001'
    }
  },
  {
    id: 'AC-129',
    make: 'LG',
    model: 'LG200',
    capacity: '2.0 Ton',
    serialNumber: 'LG39393',
    type: 'Window',
    manufacturingYear: '2021',
    installationYear: '2022',
    starRating: '3',
    powerRating: '1.8 kW',
    powerFactor: '0.90',
    status: 'Maintenance',
    lastMaintenanceType: 'Repair',
    lastMaintenanceDate: '01-Sep-2026',
    location: {
      buildingId: 'BLK-001',
      floorId: 'BLK-001-FLR-2',
      departmentId: 'DEPT-001',
      roomId: 'ROOM-001'
    }
  }
];

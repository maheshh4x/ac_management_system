// ─── Extended Mock Data for all role-based workflows ──────────────────────────

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'FACILITY_MANAGER' | 'TECHNICIAN' | 'VIEWER';
  department: string;
  phone: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export const mockUsers: MockUser[] = [
  { id: 'u1', name: 'Dr. Ramesh Kumar', email: 'admin@college.com', role: 'SUPER_ADMIN', department: 'Administration', phone: '+91 99001 00001', status: 'Active', createdAt: '2024-01-15' },
  { id: 'u2', name: 'Mrs. Lakshmi Narayanan', email: 'manager@college.com', role: 'FACILITY_MANAGER', department: 'Facilities', phone: '+91 99001 00002', status: 'Active', createdAt: '2024-02-20' },
  { id: 'u3', name: 'Mr. Suresh Babu', email: 'technician@college.com', role: 'TECHNICIAN', department: 'Maintenance', phone: '+91 99001 00003', status: 'Active', createdAt: '2024-03-10' },
  { id: 'u4', name: 'Dr. Priya Shankar', email: 'viewer@college.com', role: 'VIEWER', department: 'CSE', phone: '+91 99001 00004', status: 'Active', createdAt: '2024-04-05' },
  { id: 'u5', name: 'Mr. Karthik Rajan', email: 'tech2@college.com', role: 'TECHNICIAN', department: 'Maintenance', phone: '+91 99001 00005', status: 'Active', createdAt: '2024-05-01' },
  { id: 'u6', name: 'Ms. Anitha Devi', email: 'viewer2@college.com', role: 'VIEWER', department: 'Mechanical', phone: '+91 99001 00006', status: 'Inactive', createdAt: '2024-06-12' },
];

export interface MaintenanceJob {
  id: string;
  acId: string;
  acLocation: string;
  type: 'Preventive' | 'Repair' | 'Emergency' | 'Inspection';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo: string;
  reportedBy: string;
  description: string;
  scheduledDate: string;
  completedDate?: string;
  notes?: string;
}

export const mockMaintenanceJobs: MaintenanceJob[] = [
  { id: 'JOB-101', acId: 'AC-127', acLocation: 'BLK-001 / Floor 2 / AI Lab', type: 'Repair', status: 'Pending', priority: 'High', assignedTo: 'Mr. Suresh Babu', reportedBy: 'Dr. Priya Shankar', description: 'AC not cooling properly. Temperature not reducing below 26°C even at max setting.', scheduledDate: '2026-09-18', notes: 'Check refrigerant levels and compressor.'},
  { id: 'JOB-102', acId: 'AC-129', acLocation: 'BLK-001 / Floor 2 / Staff Room', type: 'Preventive', status: 'In Progress', priority: 'Medium', assignedTo: 'Mr. Suresh Babu', reportedBy: 'Mrs. Lakshmi Narayanan', description: 'Scheduled quarterly preventive maintenance.', scheduledDate: '2026-09-15', notes: 'Clean filters, check gas pressure.'},
  { id: 'JOB-103', acId: 'AC-128', acLocation: 'BLK-002 / Floor 1 / Room 101', type: 'Emergency', status: 'Completed', priority: 'Critical', assignedTo: 'Mr. Karthik Rajan', reportedBy: 'Admin', description: 'Compressor failure. Unit completely stopped working.', scheduledDate: '2026-09-10', completedDate: '2026-09-11', notes: 'Replaced compressor unit. Warranty claim filed.'},
  { id: 'JOB-104', acId: 'AC-130', acLocation: 'BLK-004 / Ground Floor / Director Office', type: 'Inspection', status: 'Pending', priority: 'Low', assignedTo: 'Mr. Karthik Rajan', reportedBy: 'Mrs. Lakshmi Narayanan', description: 'Annual inspection and servicing.', scheduledDate: '2026-09-20'},
  { id: 'JOB-105', acId: 'AC-131', acLocation: 'BLK-003 / Floor 2 / Computer Lab', type: 'Repair', status: 'Pending', priority: 'High', assignedTo: 'Mr. Suresh Babu', reportedBy: 'Dr. Priya Shankar', description: 'Unusual noise coming from indoor unit.', scheduledDate: '2026-09-19'},
];

export interface MovementRequest {
  id: string;
  acId: string;
  fromLocation: string;
  toLocation: string;
  reason: string;
  requestedBy: string;
  requestedByRole: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  completedDate?: string;
}

export const mockMovementRequests: MovementRequest[] = [
  { id: 'MOV-001', acId: 'AC-127', fromLocation: 'BLK-001 / Floor 2 / AI Lab', toLocation: 'BLK-004 / Ground / Director Office', reason: 'Director office requires a 1.5 Ton AC. AI Lab has a spare unit.', requestedBy: 'Mr. Suresh Babu', requestedByRole: 'TECHNICIAN', status: 'Pending', requestDate: '2026-09-17'},
  { id: 'MOV-002', acId: 'AC-129', fromLocation: 'BLK-001 / Floor 2 / Staff Room', toLocation: 'BLK-003 / Floor 1 / Seminar Hall', reason: 'Seminar hall AC is faulty. Swapping functional unit temporarily.', requestedBy: 'Mrs. Lakshmi Narayanan', requestedByRole: 'FACILITY_MANAGER', status: 'Approved', requestDate: '2026-09-10', approvedBy: 'Dr. Ramesh Kumar', approvedDate: '2026-09-11'},
  { id: 'MOV-003', acId: 'AC-130', fromLocation: 'BLK-002 / Floor 3 / Storage', toLocation: 'BLK-007 / Ground / Server Room', reason: 'New server room requires dedicated cooling.', requestedBy: 'Mr. Suresh Babu', requestedByRole: 'TECHNICIAN', status: 'Rejected', requestDate: '2026-09-05', approvedBy: 'Mrs. Lakshmi Narayanan', approvedDate: '2026-09-06', rejectionReason: 'The specified unit does not have sufficient capacity for a server room. Minimum 2 Ton required.'},
  { id: 'MOV-004', acId: 'AC-131', fromLocation: 'BLK-005 / Ground / Reading Room', toLocation: 'BLK-001 / Floor 1 / Faculty Common Room', reason: 'Library reading room AC moved to faculty room after renovation.', requestedBy: 'Mrs. Lakshmi Narayanan', requestedByRole: 'FACILITY_MANAGER', status: 'Completed', requestDate: '2026-08-20', approvedBy: 'Dr. Ramesh Kumar', approvedDate: '2026-08-21', completedDate: '2026-08-25'},
];

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  entityType: 'AC' | 'User' | 'Movement' | 'Maintenance' | 'Location' | 'System';
  entityId: string;
  details: string;
  ipAddress: string;
}

export const mockAuditLogs: AuditLog[] = [
  { id: 'LOG-001', timestamp: '2026-09-18T10:45:22', actor: 'Dr. Ramesh Kumar', actorRole: 'SUPER_ADMIN', action: 'USER_CREATED', entityType: 'User', entityId: 'u5', details: 'Created new TECHNICIAN user: Mr. Karthik Rajan', ipAddress: '192.168.1.10' },
  { id: 'LOG-002', timestamp: '2026-09-18T10:30:11', actor: 'Mrs. Lakshmi Narayanan', actorRole: 'FACILITY_MANAGER', action: 'MOVEMENT_APPROVED', entityType: 'Movement', entityId: 'MOV-002', details: 'Approved movement request for AC-129 from Staff Room to Seminar Hall', ipAddress: '192.168.1.12' },
  { id: 'LOG-003', timestamp: '2026-09-18T09:55:00', actor: 'Mr. Suresh Babu', actorRole: 'TECHNICIAN', action: 'JOB_UPDATED', entityType: 'Maintenance', entityId: 'JOB-102', details: 'Updated job JOB-102 status to In Progress. Added note: Clean filters done.', ipAddress: '192.168.1.25' },
  { id: 'LOG-004', timestamp: '2026-09-17T16:40:05', actor: 'Dr. Ramesh Kumar', actorRole: 'SUPER_ADMIN', action: 'AC_DEACTIVATED', entityType: 'AC', entityId: 'AC-130', details: 'Deactivated AC-130 (LG, 2.0 Ton, Window). Reason: End of life.', ipAddress: '192.168.1.10' },
  { id: 'LOG-005', timestamp: '2026-09-17T14:22:30', actor: 'Mrs. Lakshmi Narayanan', actorRole: 'FACILITY_MANAGER', action: 'MAINTENANCE_SCHEDULED', entityType: 'Maintenance', entityId: 'JOB-104', details: 'Scheduled Inspection for AC-130 on 2026-09-20.', ipAddress: '192.168.1.12' },
  { id: 'LOG-006', timestamp: '2026-09-16T11:00:00', actor: 'Mr. Karthik Rajan', actorRole: 'TECHNICIAN', action: 'MOVEMENT_REQUESTED', entityType: 'Movement', entityId: 'MOV-001', details: 'Created movement request for AC-127 to Directors Office.', ipAddress: '192.168.1.55' },
  { id: 'LOG-007', timestamp: '2026-09-15T09:15:44', actor: 'Dr. Ramesh Kumar', actorRole: 'SUPER_ADMIN', action: 'LOGIN', entityType: 'System', entityId: 'u1', details: 'Successful login from IP 192.168.1.10', ipAddress: '192.168.1.10' },
];

export const MOCK_PASSWORD = 'Admin@123';

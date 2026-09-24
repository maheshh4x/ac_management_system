export type Role = 'SUPER_ADMIN' | 'FACILITY_MANAGER' | 'TECHNICIAN' | 'VIEWER';

export type Permission = 
  | 'VIEW_AC' 
  | 'CREATE_AC' 
  | 'EDIT_AC' 
  | 'DEACTIVATE_AC' 
  | 'MANAGE_CAMPUS' 
  | 'MANAGE_MAINTENANCE' 
  | 'CREATE_MOVEMENT_REQUEST' 
  | 'APPROVE_MOVEMENT' 
  | 'VIEW_REPORTS' 
  | 'MANAGE_USERS' 
  | 'VIEW_AUDIT_LOGS' 
  | 'MANAGE_SETTINGS';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'VIEW_AC', 'CREATE_AC', 'EDIT_AC', 'DEACTIVATE_AC', 
    'MANAGE_CAMPUS', 'MANAGE_MAINTENANCE', 'CREATE_MOVEMENT_REQUEST', 
    'APPROVE_MOVEMENT', 'VIEW_REPORTS', 'MANAGE_USERS', 
    'VIEW_AUDIT_LOGS', 'MANAGE_SETTINGS'
  ],
  FACILITY_MANAGER: [
    'VIEW_AC', 'CREATE_AC', 'MANAGE_CAMPUS', 'MANAGE_MAINTENANCE',
    'APPROVE_MOVEMENT', 'VIEW_REPORTS'
  ],
  TECHNICIAN: [
    'VIEW_AC', 'CREATE_MOVEMENT_REQUEST', 'MANAGE_MAINTENANCE'
  ],
  VIEWER: [
    'VIEW_AC'
  ]
};

export const hasPermission = (role: Role | null, permission: Permission): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
};

export const getCurrentUserRole = (): Role | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('demo_auth');
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { role?: Role };
    return parsed.role ?? null;
  } catch {
    return null;
  }
};

export const canEditInventory = (role: Role | null): boolean => role === 'SUPER_ADMIN';
export const canManageMaintenance = (role: Role | null): boolean =>
  role === 'SUPER_ADMIN' || role === 'FACILITY_MANAGER' || role === 'TECHNICIAN';
export const canUploadMaintenanceUpdates = (role: Role | null): boolean =>
  role === 'SUPER_ADMIN' || role === 'FACILITY_MANAGER' || role === 'TECHNICIAN';
export const canApproveMaintenanceRequests = (role: Role | null): boolean =>
  role === 'SUPER_ADMIN' || role === 'FACILITY_MANAGER';
export const canApproveRequests = (role: Role | null): boolean =>
  role === 'SUPER_ADMIN' || role === 'FACILITY_MANAGER';
export const canEditProfile = (role: Role | null): boolean => role !== 'VIEWER';

export const canAccessRoute = (role: Role | null, path: string): boolean => {
  if (!role) return path === '/login';
  
  if (path.startsWith('/admin')) return role === 'SUPER_ADMIN';
  if (path.startsWith('/manager')) return role === 'FACILITY_MANAGER' || role === 'SUPER_ADMIN';
  if (path.startsWith('/technician')) return role === 'TECHNICIAN' || role === 'SUPER_ADMIN' || role === 'FACILITY_MANAGER';
  if (path.startsWith('/viewer')) return role !== null;
  
  return true; // Root or unprotected paths
};

// src/lib/maintenance-data-service.ts
import { useState, useEffect, useCallback } from 'react';
import { MaintenanceJob, mockMaintenanceJobs } from './mock-data';
import { canManageMaintenance, getCurrentUserRole } from './permissions';

export interface MaintenanceJobFilters {
  search?: string;
  status?: string;
  acId?: string;
  priority?: string;
  type?: string;
  month?: string;
}

export interface MonthlyTrendData {
  month: string; // e.g. 'Jul', 'Aug', 'Sep'
  fullMonth: string; // e.g. '2026-07'
  total: number;
  Preventive: number;
  Repair: number;
  Emergency: number;
  Inspection: number;
}

export interface MaintenanceStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  mtdCount: number; // Month-To-Date count for current month
  mttrDays: number; // Mean Time To Resolve in days
  overdueCount: number;
  upcomingCount: number;
}

class MaintenanceDataStore {
  private jobs: MaintenanceJob[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initStore();
  }

  private initStore() {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('nitttr_maintenance_jobs');
        if (cached) {
          this.jobs = JSON.parse(cached);
          return;
        }
      } catch (e) {
        console.error('Error loading maintenance jobs from localStorage:', e);
      }
    }
    // Default seed data
    this.jobs = [...mockMaintenanceJobs];
  }

  private persistStore() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nitttr_maintenance_jobs', JSON.stringify(this.jobs));
      } catch (e) {
        console.error('Error saving maintenance jobs to localStorage:', e);
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

  public getJobs(filters?: MaintenanceJobFilters): MaintenanceJob[] {
    let result = [...this.jobs];

    if (!filters) return result;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(j => 
        j.id.toLowerCase().includes(q) ||
        j.acId.toLowerCase().includes(q) ||
        j.acLocation.toLowerCase().includes(q) ||
        j.assignedTo.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q)
      );
    }

    if (filters.status && filters.status !== 'All') {
      result = result.filter(j => j.status === filters.status);
    }

    if (filters.priority && filters.priority !== 'All') {
      result = result.filter(j => j.priority === filters.priority);
    }

    if (filters.type && filters.type !== 'All') {
      result = result.filter(j => j.type === filters.type);
    }

    if (filters.acId) {
      result = result.filter(j => j.acId.toLowerCase() === filters.acId?.toLowerCase());
    }

    return result;
  }

  public getStats(filters?: MaintenanceJobFilters): MaintenanceStats {
    const dataset = this.getJobs(filters);
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];

    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let cancelled = 0;
    let mtdCount = 0;
    let overdueCount = 0;
    let upcomingCount = 0;

    let totalResolveDays = 0;
    let resolvedJobsCount = 0;

    dataset.forEach(j => {
      if (j.status === 'Pending') pending++;
      else if (j.status === 'In Progress') inProgress++;
      else if (j.status === 'Completed') completed++;
      else if (j.status === 'Cancelled') cancelled++;

      // Month-to-date check (scheduled or completed in current month)
      if (j.scheduledDate.startsWith(currentMonthStr) || (j.completedDate && j.completedDate.startsWith(currentMonthStr))) {
        mtdCount++;
      }

      // Overdue vs Upcoming for pending/in-progress jobs
      if (j.status === 'Pending' || j.status === 'In Progress') {
        if (j.scheduledDate < todayStr) {
          overdueCount++;
        } else {
          upcomingCount++;
        }
      }

      // MTTR computation
      if (j.status === 'Completed' && j.completedDate && j.scheduledDate) {
        const start = new Date(j.scheduledDate).getTime();
        const end = new Date(j.completedDate).getTime();
        if (!isNaN(start) && !isNaN(end) && end >= start) {
          const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
          totalResolveDays += diffDays;
          resolvedJobsCount++;
        } else {
          // Default 1 day resolution if date formats are simple string dates
          totalResolveDays += 1;
          resolvedJobsCount++;
        }
      }
    });

    const mttrDays = resolvedJobsCount > 0 ? parseFloat((totalResolveDays / resolvedJobsCount).toFixed(1)) : 1.2;

    return {
      total: dataset.length,
      pending,
      inProgress,
      completed,
      cancelled,
      mtdCount,
      mttrDays,
      overdueCount,
      upcomingCount
    };
  }

  // Get Monthly Trend Data dynamically for the past 6 months
  public getMonthlyTrend(): MonthlyTrendData[] {
    const monthMap = new Map<string, MonthlyTrendData>();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate default last 6 calendar months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const fullMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = monthNames[d.getMonth()];
      monthMap.set(fullMonth, {
        month: name,
        fullMonth,
        total: 0,
        Preventive: 0,
        Repair: 0,
        Emergency: 0,
        Inspection: 0
      });
    }

    // Populate actual counts from dataset
    this.jobs.forEach(job => {
      const dateStr = job.scheduledDate || job.completedDate;
      if (!dateStr) return;
      const key = dateStr.slice(0, 7); // YYYY-MM
      
      let entry = monthMap.get(key);
      if (!entry) {
        const monthPart = key.split('-')[1];
        const monthIdx = parseInt(monthPart, 10) - 1;
        if (!isNaN(monthIdx) && monthIdx >= 0 && monthIdx < 12) {
          entry = {
            month: monthNames[monthIdx],
            fullMonth: key,
            total: 0,
            Preventive: 0,
            Repair: 0,
            Emergency: 0,
            Inspection: 0
          };
          monthMap.set(key, entry);
        }
      }

      if (entry) {
        entry.total++;
        const typeKey = job.type as keyof Pick<MonthlyTrendData, 'Preventive' | 'Repair' | 'Emergency' | 'Inspection'>;
        if (entry[typeKey] !== undefined) {
          entry[typeKey]++;
        }
      }
    });

    return Array.from(monthMap.values());
  }

  public getPriorityDistribution() {
    const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    this.jobs.forEach(j => {
      if (counts[j.priority] !== undefined) {
        counts[j.priority]++;
      }
    });
    return [
      { name: 'Low', value: counts.Low, color: '#94A3B8' },
      { name: 'Medium', value: counts.Medium, color: '#3B82F6' },
      { name: 'High', value: counts.High, color: '#F97316' },
      { name: 'Critical', value: counts.Critical, color: '#EF4444' },
    ].filter(item => item.value > 0);
  }

  public addJob(newJob: Omit<MaintenanceJob, 'id'> & { id?: string }): MaintenanceJob {
    const role = getCurrentUserRole();
    if (!canManageMaintenance(role)) {
      throw new Error('You do not have permission to create maintenance jobs.');
    }

    const id = newJob.id || `JOB-${Math.floor(100 + Math.random() * 900)}`;
    const job: MaintenanceJob = { ...newJob, id };
    this.jobs.unshift(job);
    this.persistStore();
    return job;
  }

  public updateJob(id: string, updates: Partial<MaintenanceJob>): MaintenanceJob | null {
    const role = getCurrentUserRole();
    if (!canManageMaintenance(role)) {
      throw new Error('You do not have permission to update maintenance jobs.');
    }

    const idx = this.jobs.findIndex(j => j.id === id);
    if (idx === -1) return null;

    const updated = { ...this.jobs[idx], ...updates };
    this.jobs[idx] = updated;
    this.persistStore();
    return updated;
  }

  public deleteJob(id: string): boolean {
    const role = getCurrentUserRole();
    if (!canManageMaintenance(role)) {
      throw new Error('You do not have permission to delete maintenance jobs.');
    }

    const idx = this.jobs.findIndex(j => j.id === id);
    if (idx === -1) return false;
    this.jobs.splice(idx, 1);
    this.persistStore();
    return true;
  }

  public resetToDefault() {
    this.jobs = [...mockMaintenanceJobs];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nitttr_maintenance_jobs');
    }
    this.notify();
  }
}

export const maintenanceStore = new MaintenanceDataStore();

export function useMaintenanceJobs(filters?: MaintenanceJobFilters) {
  const [, setRevision] = useState(0);

  useEffect(() => {
    const unsubscribe = maintenanceStore.subscribe(() => {
      setRevision(value => value + 1);
    });

    return unsubscribe;
  }, []);

  const jobs = maintenanceStore.getJobs(filters);
  const stats = maintenanceStore.getStats(filters);
  const monthlyTrend = maintenanceStore.getMonthlyTrend();
  const priorityDistribution = maintenanceStore.getPriorityDistribution();

  const refresh = useCallback(() => {
    setRevision(value => value + 1);
  }, []);

  return {
    jobs,
    stats,
    monthlyTrend,
    priorityDistribution,
    addJob: (job: Omit<MaintenanceJob, 'id'> & { id?: string }) => maintenanceStore.addJob(job),
    updateJob: (id: string, updates: Partial<MaintenanceJob>) => maintenanceStore.updateJob(id, updates),
    deleteJob: (id: string) => maintenanceStore.deleteJob(id),
    refresh
  };
}

'use client';

import { useEffect, useState } from 'react';
import { fetchBuildings, fetchFloors, fetchDepartments, fetchRooms } from '@/lib/real-campus-service';
import { Building, Department, Floor, Room } from '@/lib/types/campus';

const STORAGE_KEY = 'nitttr_campus_management';

export interface CampusManagementData {
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  departments: Department[];
}

const initialData: CampusManagementData = {
  buildings: [],
  floors: [],
  rooms: [],
  departments: [],
};

function loadData(): CampusManagementData {
  if (typeof window === 'undefined') return initialData;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialData;
    const parsed = JSON.parse(stored) as CampusManagementData;
    return {
      buildings: parsed.buildings || initialData.buildings,
      floors: parsed.floors || initialData.floors,
      rooms: parsed.rooms || initialData.rooms,
      departments: parsed.departments || initialData.departments,
    };
  } catch {
    return initialData;
  }
}

export function useCampusManagement() {
  const [data, setData] = useState<CampusManagementData>(initialData);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      setData(loadData());
      setIsLoaded(true);
    }, 0);
    return () => window.clearTimeout(hydration);
  }, []);

  const updateData = (next: CampusManagementData) => {
    setData(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // The UI still reflects the edit when browser storage is unavailable.
    }
  };

  return { data, isLoaded, updateData };
}
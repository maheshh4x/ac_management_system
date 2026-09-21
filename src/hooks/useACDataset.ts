// src/hooks/useACDataset.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  acStore, 
  ExtendedAC, 
  ACFilters, 
  ACStatistics, 
  DataSourceStatus, 
  ImportResult 
} from '@/lib/ac-data-service';

export function useACDataset(filters?: ACFilters) {
  const [acs, setAcs] = useState<ExtendedAC[]>(() => acStore.getActiveACDataset(filters));
  const [stats, setStats] = useState<ACStatistics>(() => acStore.getACStatistics(filters));
  const [dataSource, setDataSource] = useState<DataSourceStatus>(() => acStore.getDataSourceStatus());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(() => {
    try {
      setAcs(acStore.getActiveACDataset(filters));
      setStats(acStore.getACStatistics(filters));
      setDataSource(acStore.getDataSourceStatus());
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh AC dataset');
    }
  }, [filters]);

  useEffect(() => {
    refreshData();
    const unsubscribe = acStore.subscribe(() => {
      refreshData();
    });
    return unsubscribe;
  }, [refreshData]);

  const importACAssets = async (newACs: ExtendedAC[]) => {
    setLoading(true);
    try {
      const res = await acStore.importACAssets(newACs);
      refreshData();
      setLoading(false);
      return res;
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  const replaceDemoACAssets = async (newACs: ExtendedAC[]) => {
    setLoading(true);
    try {
      const res = await acStore.replaceDemoACAssets(newACs);
      refreshData();
      setLoading(false);
      return res;
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  const resetToDemoData = () => {
    acStore.resetToDemoData();
    refreshData();
  };

  const updateACAsset = (acId: string, updates: Partial<ExtendedAC>) => {
    const res = acStore.updateACAsset(acId, updates);
    refreshData();
    return res;
  };

  return {
    acs,
    stats,
    dataSource,
    loading,
    error,
    refreshData,
    importACAssets,
    replaceDemoACAssets,
    resetToDemoData,
    updateACAsset,
    // Chart helpers
    statusDistribution: acStore.getACStatusDistribution(filters),
    typeDistribution: acStore.getACTypeDistribution(filters),
    buildingDistribution: acStore.getBuildingDistribution(filters),
    capacityDistribution: acStore.getACCapacityDistribution(filters),
  };
}

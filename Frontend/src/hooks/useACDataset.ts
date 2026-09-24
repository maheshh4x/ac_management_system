// src/hooks/useACDataset.ts
import { useState, useEffect, useCallback } from 'react';
import {
  acStore,
  ExtendedAC,
  ACFilters,
} from '@/lib/ac-data-service';

export function useACDataset(filters?: ACFilters) {
  const [, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(() => {
    setRefreshTick(value => value + 1);
    setError(null);
  }, []);

  useEffect(() => {
    const unsubscribe = acStore.subscribe(() => {
      setRefreshTick(value => value + 1);
    });

    return unsubscribe;
  }, []);

  const acs = acStore.getActiveACDataset(filters);
  const stats = acStore.getACStatistics(filters);
  const dataSource = acStore.getDataSourceStatus();

  const importACAssets = async (newACs: ExtendedAC[]) => {
    setLoading(true);
    try {
      const res = await acStore.importACAssets(newACs);
      refreshData();
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import AC assets';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const replaceDemoACAssets = async (newACs: ExtendedAC[]) => {
    setLoading(true);
    try {
      const res = await acStore.replaceDemoACAssets(newACs);
      refreshData();
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to replace demo AC assets';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetToDemoData = () => {
    acStore.resetToDemoData();
    refreshData();
  };

  const updateACAsset = async (acId: string, updates: Partial<ExtendedAC>) => {
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
    statusDistribution: acStore.getACStatusDistribution(filters),
    typeDistribution: acStore.getACTypeDistribution(filters),
    buildingDistribution: acStore.getBuildingDistribution(filters),
    capacityDistribution: acStore.getACCapacityDistribution(filters),
    brandDistribution: acStore.getBrandDistribution(filters),
    totalAssetValue: acStore.getTotalAssetValue(filters),
    avgAcAge: acStore.getAverageACAge(filters),
    connectedPowerLoad: acStore.getConnectedPowerLoad(filters),
    assetValueByBuilding: acStore.getAssetValueByBuilding(filters),
    assetValueByType: acStore.getAssetValueByType(filters),
    faultFrequencyByBuilding: acStore.getFaultFrequencyByBuilding(filters),
  };
}

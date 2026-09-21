import { Building, Floor, Department, Room, AC } from './types/campus';
import { fetchBuildings, fetchFloors, fetchDepartments, fetchRooms } from './real-campus-service';
import { acStore } from './ac-data-service';

export const getBuildings = async (): Promise<Building[]> => {
  return await fetchBuildings();
};

export const getBuilding = async (id: string): Promise<Building | undefined> => {
  const buildings = await fetchBuildings();
  return buildings.find(b => b.id === id);
};

export const getFloors = async (buildingId: string): Promise<Floor[]> => {
  return await fetchFloors(buildingId);
};

export const getFloor = async (id: string): Promise<Floor | undefined> => {
  const allFloors = await fetchFloors(''); // fetch all floors, filter locally
  return allFloors.find(f => f.id === id);
};

export const getDepartments = async (floorId: string): Promise<Department[]> => {
  return await fetchDepartments(floorId);
};

export const getRooms = async (floorId: string): Promise<Room[]> => {
  return await fetchRooms(floorId);
};

export const getACs = async (roomId: string): Promise<AC[]> => {
  const currentACs = acStore.getActiveACDataset();
  return currentACs.filter(ac => ac.location.roomId === roomId);
};

export const getAC = async (id: string): Promise<AC | undefined> => {
  const currentACs = acStore.getActiveACDataset();
  return currentACs.find(ac => ac.id === id);
};

export const searchAssets = async (query: string): Promise<{
    acs: AC[], buildings: Building[], rooms: Room[]
}> => {
  const lowerQuery = query.toLowerCase();
  const currentACs = acStore.getActiveACDataset();
  
  const acs = currentACs.filter(ac => 
    ac.id.toLowerCase().includes(lowerQuery) || 
    ac.make.toLowerCase().includes(lowerQuery) ||
    ac.model.toLowerCase().includes(lowerQuery) || 
    (ac.serialNumber && ac.serialNumber.toLowerCase().includes(lowerQuery))
  );

  const buildings = (await fetchBuildings()).filter(b => 
    b.name.toLowerCase().includes(lowerQuery) || 
    b.id.toLowerCase().includes(lowerQuery)
  );

  const rooms = (await fetchRooms('')).filter(r => 
    r.name.toLowerCase().includes(lowerQuery) || 
    r.id.toLowerCase().includes(lowerQuery)
  );

  return { acs, buildings, rooms };
};

export const getCampusStats = async () => {
  const stats = acStore.getACStatistics();
  const buildings = await fetchBuildings();
  const buildingsCount = buildings.length;
  const dataSource = acStore.getDataSourceStatus();

  return {
    totalACs: stats.total,
    working: stats.working,
    faulty: stats.faulty,
    maintenance: stats.underMaintenance,
    buildingsCount,
    isDemoDatabase: dataSource.isDemo
  };
};

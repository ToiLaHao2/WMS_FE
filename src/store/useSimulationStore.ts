import { create } from 'zustand';

export type LogType = 'info' | 'warning' | 'success' | 'error';
export type AppStatus = 'setup' | 'loading' | 'running';

export interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: LogType;
}

export interface AGVData {
  id: string;
  status: 'idle' | 'moving' | 'charging';
  battery: number;
  x: number;
  y: number;
  currentTask: string | null;
}

export interface WarehouseStats {
  totalCapacity: number;
  usedCapacity: number;
  pendingOrders: number;
}

export interface WarehouseConfig {
  id: string | null;
  width: number;
  height: number;
  layoutType: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  size: number;
  weight: number;
  description: string;
  slotId?: string; // The ID of the storage slot where this item is located
}

interface SimulationState {
  appStatus: AppStatus;
  warehouseConfig: WarehouseConfig;
  stats: WarehouseStats;
  agvs: AGVData[];
  logs: LogEntry[];
  inventory: InventoryItem[];
  
  // Actions
  addLog: (message: string, type: LogType) => void;
  updateAGVStatus: (id: string, updates: Partial<AGVData>) => void;
  
  // Logic
  checkImportFeasibility: (size: number) => boolean;
  importGoods: (item: Omit<InventoryItem, 'id'>) => string; // returns generated ID
  exportGoods: (itemId: string) => boolean; // returns true if successful
  
  loadWarehouse: (id: string) => Promise<void>;
  createWarehouse: (config: Omit<WarehouseConfig, 'id'>, initialAgvCount: number) => Promise<void>;
}

export const generateId = () => Math.random().toString(36).substring(2, 9).toUpperCase();

export const useSimulationStore = create<SimulationState>((set, get) => ({
  appStatus: 'setup',
  warehouseConfig: {
    id: null,
    width: 0,
    height: 0,
    layoutType: 'standard',
  },
  stats: {
    totalCapacity: 0,
    usedCapacity: 0,
    pendingOrders: 0,
  },
  agvs: [],
  logs: [],
  inventory: [],

  addLog: (message, type) =>
    set((state) => ({
      logs: [
        { id: generateId(), time: new Date().toLocaleTimeString(), message, type },
        ...state.logs,
      ].slice(0, 50),
    })),

  updateAGVStatus: (id, updates) =>
    set((state) => ({
      agvs: state.agvs.map((agv) => (agv.id === id ? { ...agv, ...updates } : agv)),
    })),

  checkImportFeasibility: (size) => {
    const { stats } = get();
    return stats.usedCapacity + size <= stats.totalCapacity;
  },

  importGoods: (item) => {
    const state = get();
    const itemId = `ITEM-${generateId()}`;
    const randomSlot = `S${Math.floor(Math.random() * 50) + 1}`;
    const newItem = { ...item, id: itemId, slotId: randomSlot };
    
    // Assign task to first idle AGV
    const idleAgv = state.agvs.find(a => a.status === 'idle');
    if (idleAgv) {
      state.updateAGVStatus(idleAgv.id, { 
        status: 'moving', 
        currentTask: `Importing ${itemId} to ${randomSlot}` 
      });
      // Simulate task completion after 5 seconds
      setTimeout(() => {
        state.updateAGVStatus(idleAgv.id, { status: 'idle', currentTask: null });
      }, 5000);
    }

    set((state) => {
      const newUsed = Math.min(state.stats.usedCapacity + item.size, state.stats.totalCapacity);
      return {
        inventory: [...state.inventory, newItem],
        stats: { ...state.stats, usedCapacity: newUsed },
        logs: [
          { id: generateId(), time: new Date().toLocaleTimeString(), message: `Nhập thành công hàng: ${item.name} (ID: ${itemId}) vào ô ${randomSlot}`, type: 'success' as LogType },
          ...state.logs,
        ].slice(0, 50)
      };
    });
    
    return itemId;
  },

  exportGoods: (itemId) => {
    const state = get();
    const itemIndex = state.inventory.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) {
      state.addLog(`Xuất hàng thất bại: Không tìm thấy ID ${itemId}`, 'error');
      return false;
    }
    
    const itemToExport = state.inventory[itemIndex];

    // Assign task to first idle AGV
    const idleAgv = state.agvs.find(a => a.status === 'idle');
    if (idleAgv) {
      state.updateAGVStatus(idleAgv.id, { 
        status: 'moving', 
        currentTask: `Exporting ${itemId} from ${itemToExport.slotId}` 
      });
      setTimeout(() => {
        state.updateAGVStatus(idleAgv.id, { status: 'idle', currentTask: null });
      }, 5000);
    }
    
    set((state) => {
      const newInventory = [...state.inventory];
      newInventory.splice(itemIndex, 1);
      
      const newUsed = Math.max(state.stats.usedCapacity - itemToExport.size, 0);
      return {
        inventory: newInventory,
        stats: { ...state.stats, usedCapacity: newUsed },
        logs: [
          { id: generateId(), time: new Date().toLocaleTimeString(), message: `Đã xuất kho: ${itemToExport.name} (ID: ${itemToExport.id})`, type: 'info' as LogType },
          ...state.logs,
        ].slice(0, 50)
      };
    });
    
    return true;
  },

  loadWarehouse: async (id: string) => {
    set({ appStatus: 'loading' });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set({
      appStatus: 'running',
      warehouseConfig: { id, width: 1000, height: 800, layoutType: 'dense' },
      stats: { totalCapacity: 10000, usedCapacity: 6500, pendingOrders: 12 },
      agvs: [
        { id: 'AGV-01', status: 'moving', battery: 85, x: 5, y: 3, currentTask: 'Moving to Shelf A' },
        { id: 'AGV-02', status: 'charging', battery: 20, x: 1, y: 1, currentTask: 'Charging...' },
      ],
      inventory: [],
      logs: [{ id: generateId(), time: new Date().toLocaleTimeString(), message: `Loaded warehouse ${id}.`, type: 'success' }]
    });
  },

  createWarehouse: async (config, initialAgvCount) => {
    set({ appStatus: 'loading' });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const newId = `WH-${generateId().toUpperCase()}`;
    const initialAgvs: AGVData[] = Array.from({ length: initialAgvCount }).map((_, i) => ({
      id: `AGV-${(i + 1).toString().padStart(2, '0')}`,
      status: 'idle',
      battery: 100,
      x: Math.floor(Math.random() * config.width),
      y: Math.floor(Math.random() * config.height),
      currentTask: null
    }));
    
    set({
      appStatus: 'running',
      warehouseConfig: { id: newId, width: config.width, height: config.height, layoutType: config.layoutType },
      stats: { totalCapacity: config.width * config.height / 100, usedCapacity: 0, pendingOrders: 0 },
      agvs: initialAgvs,
      inventory: [],
      logs: [{ id: generateId(), time: new Date().toLocaleTimeString(), message: `Created warehouse ${newId} with ${initialAgvCount} AGVs.`, type: 'success' }]
    });
  }
}));

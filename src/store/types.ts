import type { ReactNode } from 'react';

export type LogType = 'info' | 'warning' | 'success' | 'error';
export type AppStatus = 'setup' | 'loading' | 'running';

export interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: LogType;
}

export interface AGVData {
  [x: string]: ReactNode;
  id: string;
  status: 'idle' | 'moving' | 'charging' | string;
  battery: number;
  x: number;
  y: number;
  currentTask: string | null;
  isCarrying?: boolean;
}

export interface WarehouseStats {
  totalCapacity: number;
  usedCapacity: number;
  pendingOrders: number;
}

export interface WarehouseConfig {
  id: string | null;
  code: string | null;
  width: number;   // cols (grid cells)
  height: number;  // rows (grid cells)
  layoutType: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  size: number;
  weight: number;
  description: string;
  slotId?: string;
}

export interface SlotData {
  id: string;
  slot_code: string;
  x: number;
  y: number;
  width: number;
  height: number;
  slot_type: 'STORAGE' | 'AISLE' | 'BLOCKED' | 'PICKUP' | 'DROPOFF' | 'CHARGING';
  status: string;
  metadata?: any;
}

// Grid cell values (match backend)
// 0=AISLE, 1=STORAGE, 2=BLOCKED(wall), 3=CHARGING
export type LayoutGrid = number[][];

export interface InboundPackage {
  id: string;
  x: number;
  y: number;
  code: string;
}

export interface SimulationState {
  appStatus: AppStatus;
  warehouseConfig: WarehouseConfig;
  stats: WarehouseStats;
  agvs: AGVData[];
  logs: LogEntry[];
  inventory: InventoryItem[];
  slots: SlotData[];
  layoutGrid: LayoutGrid | null;  // Static map matrix from backend
  availableWarehouses: any[]; // List for selection
  lastError: string | null;
  inboundQueue: InboundPackage[]; // Queue chờ ở khu vực Inbound

  // Actions
  addLog: (message: string, type: LogType) => void;
  updateAGVStatus: (id: string, updates: Partial<AGVData>) => void;
  reserveSlots: (allocatedSlots: any[]) => void;
  checkImportFeasibility: (size: number) => boolean;
  clearError: () => void;

  // Logic
  checkImportFeasibility: (size: number) => boolean;
  importGoods: (itemId: string, quantity: number) => Promise<string | null>;
  exportGoods: (itemId: string) => boolean;
  updateAGVPosition: (id: string, x: number, y: number, status: AGVData['status']) => void;

  loadWarehouse: (id: string) => Promise<void>;
  createWarehouse: (config: Omit<WarehouseConfig, 'id' | 'code'>, initialAgvCount: number) => Promise<void>;
  fetchAvailableWarehouses: () => Promise<void>;
  resetSimulation: () => void;
}

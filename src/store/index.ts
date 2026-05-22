// Re-export tất cả từ store — các file khác chỉ cần: import { ... } from '@/store'
export { useSimulationStore, generateId } from './useSimulationStore';
export { API_MASTER_DATA, API_INBOUND, API_OUTBOUND } from './api';
export type {
  LogType,
  AppStatus,
  LogEntry,
  AGVData,
  WarehouseStats,
  WarehouseConfig,
  InventoryItem,
  SlotData,
  LayoutGrid,
  SimulationState,
} from './types';

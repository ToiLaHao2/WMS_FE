import { create } from 'zustand';
import type { SimulationState, AGVData, LogType, SlotData } from './types';
import { API_MASTER_DATA, API_INBOUND } from './api';

// Re-export types để các file cũ import từ đây vẫn hoạt động
export type { LogType, AppStatus, LogEntry, AGVData, WarehouseStats, WarehouseConfig, InventoryItem, SlotData, LayoutGrid, SimulationState } from './types';
export { API_MASTER_DATA, API_INBOUND } from './api';

export const generateId = () => Math.random().toString(36).substring(2, 9).toUpperCase();

export const useSimulationStore = create<SimulationState>((set, get) => ({
  appStatus: 'setup',
  warehouseConfig: {
    id: null,
    code: null,
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
  slots: [],
  layoutGrid: null,
  availableWarehouses: [],
  lastError: null,

  addLog: (message, type) =>
    set((state) => ({
      logs: [
        { id: generateId(), time: new Date().toLocaleTimeString(), message, type },
        ...state.logs,
      ].slice(0, 50),
    })),

  clearError: () => set({ lastError: null }),

  updateAGVStatus: (id, updates) =>
    set((state) => ({
      agvs: state.agvs.map((agv) => (agv.id === id ? { ...agv, ...updates } : agv)),
    })),

  checkImportFeasibility: (size) => {
    const { stats } = get();
    return stats.usedCapacity + size <= stats.totalCapacity;
  },

  updateAGVPosition: (id, x, y, status) => set(state => ({
    agvs: state.agvs.map(agv =>
      agv.id === id ? { ...agv, x, y, status: status as AGVData['status'] } : agv
    )
  })),

  importGoods: async (itemId: string, quantity: number) => {
    const state = get();
    state.addLog(`Đang gửi yêu cầu nhập hàng: ${itemId} (Số lượng: ${quantity})...`, 'info');

    try {
      // 1. Tạo Inbound Order qua API Backend
      const res = await fetch(`${API_INBOUND}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouse_id: state.warehouseConfig?.id,
          code: `IN-${Date.now()}`,
          items: [{ product_id: itemId, quantity: quantity }]
        })
      });

      if (!res.ok) {
        throw new Error('Không thể tạo Inbound Order. Server trả về lỗi.');
      }

      state.addLog(`Nhận yêu cầu nhập hàng thành công! Đang chờ AGV xử lý...`, 'success');
      return itemId;
    } catch (err: any) {
      state.addLog(`Lỗi nhập hàng: ${err.message}`, 'error');
      return null;
    }
  },

  exportGoods: (itemId) => {
    const state = get();
    const itemIndex = state.inventory.findIndex(i => i.id === itemId);

    if (itemIndex === -1) {
      state.addLog(`Xuất hàng thất bại: Không tìm thấy ID ${itemId}`, 'error');
      return false;
    }

    const itemToExport = state.inventory[itemIndex];

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
    set({ appStatus: 'loading', lastError: null });
    try {
      // Fetch warehouse (includes layout_data)
      const whRes = await fetch(`${API_MASTER_DATA}/warehouses/${id}`);
      if (!whRes.ok) {
        const errData = await whRes.json();
        throw new Error(errData.message || `Warehouse not found (${id})`);
      }
      const warehouse = await whRes.json();

      // Fetch functional slots
      const slotsRes = await fetch(`${API_MASTER_DATA}/warehouses/${id}/slots`);
      const slots = await slotsRes.json();

      const storageCount = slots.filter((s: SlotData) => s.slot_type === 'STORAGE').length;

      // 3. Fetch AGVs
      const agvRes = await fetch(`${API_MASTER_DATA}/warehouses/${warehouse.id}/agvs`);
      const agvsDb = await agvRes.json();
      const mappedAgvs = agvsDb.map((a: any) => ({
        id: a.id,
        code: a.code,
        status: a.status.toLowerCase(),
        battery: a.battery_capacity,
        x: a.current_x,
        y: a.current_y,
        currentTask: null
      }));

      set({
        appStatus: 'running',
        warehouseConfig: { id: warehouse.id, code: warehouse.code, width: warehouse.width, height: warehouse.height, layoutType: warehouse.layout_type },
        layoutGrid: warehouse.layout_data,
        slots: slots,
        stats: { totalCapacity: storageCount, usedCapacity: 0, pendingOrders: 0 },
        agvs: mappedAgvs,
        inventory: [],
        logs: [{ id: generateId(), time: new Date().toLocaleTimeString(), message: `Loaded warehouse ${warehouse.code}.`, type: 'success' }]
      });
    } catch (error: any) {
      console.error(error);
      set({
        appStatus: 'setup',
        lastError: error.message,
        logs: [{ id: generateId(), time: new Date().toLocaleTimeString(), message: error.message, type: 'error' }]
      });
      throw error;
    }
  },

  createWarehouse: async (config, initialAgvCount) => {
    set({ appStatus: 'loading' });

    try {
      const code = `WH-${generateId()}`;

      // 1. Call Backend to create warehouse (returns warehouse with layout_data)
      const res = await fetch(`${API_MASTER_DATA}/warehouses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name: `Warehouse ${code}`,
          width: config.width,
          height: config.height,
          layout_type: config.layoutType,
          initial_agv_count: initialAgvCount,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create warehouse');
      }
      const warehouse = await res.json();

      // 2. Fetch the functional slots
      const slotsRes = await fetch(`${API_MASTER_DATA}/warehouses/${warehouse.id}/slots`);
      const slots: SlotData[] = await slotsRes.json();

      const storageCount = slots.filter(s => s.slot_type === 'STORAGE').length;
      const chargingSlots = slots.filter(s => s.slot_type === 'CHARGING');

      // 3. Fetch AGVs that were spawned by backend
      const agvRes = await fetch(`${API_MASTER_DATA}/warehouses/${warehouse.id}/agvs`);
      const agvsDb = await agvRes.json();
      const mappedAgvs = agvsDb.map((a: any) => ({
        id: a.id,
        code: a.code,
        status: a.status.toLowerCase(),
        battery: a.battery_capacity,
        x: a.current_x,
        y: a.current_y,
        currentTask: null
      }));

      set({
        appStatus: 'running',
        warehouseConfig: { id: warehouse.id, code: warehouse.code, width: warehouse.width, height: warehouse.height, layoutType: warehouse.layout_type },
        layoutGrid: warehouse.layout_data,
        slots: slots,
        stats: { totalCapacity: storageCount, usedCapacity: 0, pendingOrders: 0 },
        agvs: mappedAgvs,
        inventory: [],
        logs: [{ id: generateId(), time: new Date().toLocaleTimeString(), message: `Created warehouse ${warehouse.code}: ${warehouse.width}x${warehouse.height} grid, ${storageCount} storage slots, ${chargingSlots.length} charging stations.`, type: 'success' }]
      });
    } catch (error: any) {
      console.error(error);
      set({
        appStatus: 'setup',
        lastError: error.message,
        logs: [{ id: generateId(), time: new Date().toLocaleTimeString(), message: error.message, type: 'error' }]
      });
      throw error;
    }
  },

  fetchAvailableWarehouses: async () => {
    try {
      const res = await fetch(`${API_MASTER_DATA}/warehouses`);
      if (res.ok) {
        const data = await res.json();
        set({ availableWarehouses: data });
      }
    } catch (err) {
      console.error("Failed to fetch warehouses", err);
    }
  },

  resetSimulation: () => {
    set({
      appStatus: 'setup',
      agvs: [],
      logs: [],
      inventory: [],
      slots: [],
      layoutGrid: null,
      warehouseConfig: {
        id: '',
        code: null,
        width: 0,
        height: 0,
        layoutType: 'standard'
      }
    });
  }
}));

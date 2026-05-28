// API Base URLs — tập trung tại đây để dễ thay đổi khi chuyển môi trường
// Sử dụng biến môi trường Vite: VITE_API_BASE_URL và VITE_SOCKET_URL
// Dev: .env.development | Production: .env.production

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const API_MASTER_DATA = `${API_BASE}/api/master-data`;
export const API_INBOUND = `${API_BASE}/api/inbound`;
export const API_OUTBOUND = `${API_BASE}/api/outbound`;
export const API_AGV = `${API_BASE}/api/agv`;
export const API_INVENTORY = `${API_BASE}/api/inventory`;

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

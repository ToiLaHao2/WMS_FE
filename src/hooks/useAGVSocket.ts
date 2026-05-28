import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useSimulationStore } from '../store/useSimulationStore';
import { SOCKET_URL } from '../store/api';

export function useAGVSocket() {
  const { updateAGVPosition, addLog } = useSimulationStore();

  useEffect(() => {
    // Kết nối tới Socket.IO server của BE
    const socket = io(SOCKET_URL, {
      auth: {
        token: 'DUMMY_TOKEN_FOR_NOW' // Thêm JWT token nếu BE yêu cầu
      }
    });

    socket.on('connect', () => {
      console.log('✅ Đã kết nối tới Realtime Server (Socket.IO)');
      addLog('Đã kết nối thành công tới máy chủ Realtime.', 'info');
    });

    socket.on('agv_moved', (data) => {
      // Dữ liệu từ Kafka: { agv_id, inbound_order_id, x, y, action }
      updateAGVPosition(data.agv_id, data.x, data.y, data.action);
    });

    socket.on('slot_allocated', (data) => {
      // Dữ liệu từ Worker: { order_id, slots: [{ slot_id, x, y }] }
      useSimulationStore.getState().reserveSlots(data.slots);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    socket.on('disconnect', () => {
      console.log('❌ Mất kết nối tới Realtime Server');
    });

    return () => {
      socket.disconnect();
    };
  }, [updateAGVPosition, addLog]);
}

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://foodrescue-8yh2.onrender.com';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to FoodRescue Realtime Engine:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection warning (operating in local fallback mode):', err.message);
    });
  }
  return socket;
};

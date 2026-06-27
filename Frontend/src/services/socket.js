import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  socket = null;

  connect(token) {
    if (this.socket) {
      if (this.socket.auth?.token === token && this.socket.connected) {
        return this.socket;
      }
      this.socket.disconnect();
    }
    this.socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'], reconnection: true });
    return this.socket;
  }

  disconnect()    { this.socket?.disconnect(); this.socket = null; }
  getSocket()     { return this.socket; }
  joinUserRoom(id){ this.socket?.emit('join_user_room', id); }
}

export const socketService = new SocketService();
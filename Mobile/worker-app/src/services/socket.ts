import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

class SocketService {
  private socket: Socket | null = null;
  private url: string = (() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      return `http://${window.location.hostname}:3000`;
    }
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
  })();

  setUrl(newUrl: string) {
    this.url = newUrl;
  }

  connect(token: string) {
    if (this.socket) {
      if (this.socket.auth && typeof this.socket.auth === 'object' && 'token' in this.socket.auth && this.socket.auth.token === token && this.socket.connected) {
        return this.socket;
      }
      this.socket.disconnect();
    }
    this.socket = io(this.url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket() {
    return this.socket;
  }

  joinUserRoom(id: string) {
    this.socket?.emit('join_user_room', id);
  }
}

export const socketService = new SocketService();
export default socketService;

import { io, Socket } from 'socket.io-client';
import type { Ticket, Comment, ImpactEvent } from '../lib/types';

// Event map type that defines all possible socket events and their data types
type EventMap = {
  'ticket:created': Ticket;
  'ticket:updated': Ticket;
  'comment:created': Comment;
  'impact:created': ImpactEvent;
};

// Type-safe event handler
type EventHandler<K extends keyof EventMap> = (data: EventMap[K]) => void;

// Type-safe socket.io event listener
type TypedSocket = Socket & {
  on<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): TypedSocket;
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): boolean;
};

class SocketClient {
  private socket: TypedSocket | null = null;
  private handlers: { [K in keyof EventMap]?: Array<EventHandler<K>> } = {};

  connect() {
    if (this.socket?.connected) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    this.socket = io(SOCKET_URL, {
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    }) as TypedSocket;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.setupHandlers();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });
  }

  private setupHandlers() {
    if (!this.socket) return;

    (Object.keys(this.handlers) as Array<keyof EventMap>).forEach((event) => {
      const handlers = this.handlers[event];
      if (handlers?.length) {
        this.socket?.on(event, (data) => {
          handlers.forEach((handler) => handler(data));
        });
      }
    });
  }

  disconnect() {
    if (!this.socket) return;
    
    (Object.keys(this.handlers) as Array<keyof EventMap>).forEach((event) => {
      this.socket?.off(event);
    });
    
    this.socket.disconnect();
    this.socket = null;
    this.handlers = {};
  }

  on<K extends keyof EventMap>(event: K, handler: EventHandler<K>) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }

    this.handlers[event]?.push(handler);

    if (this.socket?.connected) {
      this.socket.on(event, (data) => {
        const eventHandlers = this.handlers[event];
        if (eventHandlers) {
          eventHandlers.forEach((h) => h(data));
        }
      });
    }
  }

  off<K extends keyof EventMap>(event: K, handler: EventHandler<K>) {
    const handlers = this.handlers[event];
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }

    if (handlers.length === 0) {
      delete this.handlers[event];
      this.socket?.off(event);
    }
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
}

const socketInstance = new SocketClient();
export { socketInstance as socketClient };
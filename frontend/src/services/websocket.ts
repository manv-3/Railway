import { getApiBaseUrl } from './api';

type EventHandler = (data: any) => void;

class CorridorWebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, EventHandler[]> = new Map();
  private reconnectInterval = 3000;
  private shouldReconnect = true;

  constructor() {
    this.connect();
  }

  public connect() {
    let wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      const apiUrl = getApiBaseUrl();
      if (apiUrl) {
        const wsProto = apiUrl.startsWith('https://') ? 'wss://' : 'ws://';
        const host = apiUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        wsUrl = `${wsProto}${host}/ws/corridor`;
      } else if (typeof window !== 'undefined') {
        const wsProto = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        wsUrl = `${wsProto}${window.location.host}/ws/corridor`;
      } else {
        wsUrl = 'ws://localhost:8000/ws/corridor';
      }
    }
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[CorridorWebSocket] Connected to real-time event bus.');
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const eventType = payload.event;
          const data = payload.data || payload;

          if (this.listeners.has(eventType)) {
            this.listeners.get(eventType)?.forEach((handler) => handler(data));
          }
        } catch (err) {
          console.error('[CorridorWebSocket] Failed to parse message:', err);
        }
      };

      this.ws.onclose = () => {
        console.warn('[CorridorWebSocket] Disconnected. Reconnecting in 3s...');
        if (this.shouldReconnect) {
          setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[CorridorWebSocket] Error:', error);
        this.ws?.close();
      };
    } catch (e) {
      console.error('[CorridorWebSocket] Connection failed:', e);
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    }
  }

  public on(event: string, handler: EventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(handler);

    // Return un-subscribe function
    return () => {
      const handlers = this.listeners.get(event);
      if (handlers) {
        this.listeners.set(
          event,
          handlers.filter((h) => h !== handler)
        );
      }
    };
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }

  public disconnect() {
    this.shouldReconnect = false;
    this.ws?.close();
  }
}

export const wsService = new CorridorWebSocketService();

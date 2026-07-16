import { useEffect, useRef, useState } from 'react';
import type { ServiceRequest } from './types';

export interface StaffFeedMessage {
  event: 'service_request_created' | 'service_request_updated';
  request: ServiceRequest;
}

function resolveWsUrl(): string {
  const explicit = import.meta.env.VITE_WS_BASE_URL as string | undefined;
  if (explicit) return explicit;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/staff/`;
}

const RECONNECT_DELAY_MS = 2000;

export function useStaffFeed(onMessage: (message: StaffFeedMessage) => void) {
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      socket = new WebSocket(resolveWsUrl());

      socket.onopen = () => setConnected(true);

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as StaffFeedMessage;
          onMessageRef.current(message);
        } catch {
          // Ignore malformed frames — the next valid message keeps the feed live.
        }
      };

      socket.onclose = () => {
        setConnected(false);
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      socket.onerror = () => {
        socket?.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  return { connected };
}

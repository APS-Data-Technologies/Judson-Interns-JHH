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
const POLL_INTERVAL_MS = 5000;

/**
 * Live staff feed over Channels, with the polling fallback the scope calls for if
 * real-time slips (5.3). `onPoll` is invoked on an interval whenever the socket is
 * not connected, so a floor never goes silent because a WebSocket was blocked.
 */
export function useStaffFeed(onMessage: (message: StaffFeedMessage) => void, onPoll?: () => void) {
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const onPollRef = useRef(onPoll);
  onPollRef.current = onPoll;

  useEffect(() => {
    if (connected) return undefined;
    const timer = setInterval(() => onPollRef.current?.(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [connected]);

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

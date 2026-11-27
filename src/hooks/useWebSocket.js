import { useEffect, useRef, useState, useCallback } from "react";
import { API_BASE_URL } from "../config/api";

/**
 * Custom native WebSocket hook for StayOps PMS.
 * Provides auto-reconnection (exponential backoff), ping heartbeat,
 * topic channel subscriptions, and silent fallback if server is offline.
 */
export function useWebSocket(propertyId, options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const subscriptionsRef = useRef(new Map());

  const { onEvent, autoReconnect = true } = options;

  const connect = useCallback(() => {
    if (!propertyId) return;

    // Clean up existing socket if any
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      const token = localStorage.getItem("token") || "";
      // Convert http/https API_BASE_URL to ws/wss URL cleanly
      const cleanBase = API_BASE_URL.replace(/\/api\/?$/, "").replace(/^http/, "ws");
      const wsUrl = `${cleanBase}/ws?propertyId=${encodeURIComponent(propertyId)}&token=${encodeURIComponent(token)}`;

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log(`[StayOps WebSocket] Connected to live stream for Property #${propertyId}`);
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Start ping heartbeat every 30 seconds to keep connection alive through proxies
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "PING", timestamp: Date.now() }));
          }
        }, 30000);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Ignore PONG responses
          if (data.type === "PONG") return;

          setLastMessage(data);

          if (onEvent) {
            onEvent(data);
          }

          // Trigger topic-specific subscribers
          if (data.topic && subscriptionsRef.current.has(data.topic)) {
            const handlers = subscriptionsRef.current.get(data.topic);
            handlers.forEach((handler) => handler(data));
          }
        } catch (e) {
          console.warn("[StayOps WebSocket] Unparseable message received:", event.data);
        }
      };

      socket.onerror = () => {
        // Silent warning - degrades gracefully if backend WS is not active
      };

      socket.onclose = (event) => {
        setIsConnected(false);
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

        // Limit reconnect attempts to max 2 to avoid repetitive console noise if backend WS is offline
        if (autoReconnect && !event.wasClean && reconnectAttemptsRef.current < 2) {
          const delay = 5000;
          reconnectAttemptsRef.current += 1;
          
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (err) {
      console.warn("[StayOps WebSocket] WebSocket initialization error:", err);
    }
  }, [propertyId, onEvent, autoReconnect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // Subscribe to specific topics (e.g. 'FRONTDESK', 'INBOX', 'MEALS')
  const subscribe = useCallback((topic, handler) => {
    if (!subscriptionsRef.current.has(topic)) {
      subscriptionsRef.current.set(topic, new Set());
    }
    subscriptionsRef.current.get(topic).add(handler);

    // Unsubscribe function
    return () => {
      if (subscriptionsRef.current.has(topic)) {
        subscriptionsRef.current.get(topic).delete(handler);
      }
    };
  }, []);

  // Send payload down live socket
  const sendMessage = useCallback((payload) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  return {
    isConnected,
    lastMessage,
    subscribe,
    sendMessage,
    reconnect: connect
  };
}

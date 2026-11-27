import React, { createContext, useContext, useState, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { API_BASE_URL } from "../config/api";

const WebSocketContext = createContext({
  isConnected: false,
  lastMessage: null,
  activePropertyId: null,
  setActivePropertyId: () => {},
  subscribe: () => () => {},
  sendMessage: () => false,
  reconnect: () => {}
});

export function WebSocketProvider({ children }) {
  const [activePropertyId, setActivePropertyId] = useState(null);

  // Auto-fetch primary property ID if not explicitly set
  useEffect(() => {
    if (activePropertyId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_BASE_URL}/properties`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(props => {
        if (Array.isArray(props) && props.length > 0) {
          setActivePropertyId(props[0].id);
        }
      })
      .catch(() => {});
  }, [activePropertyId]);

  const { isConnected, lastMessage, subscribe, sendMessage, reconnect } = useWebSocket(activePropertyId);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        lastMessage,
        activePropertyId,
        setActivePropertyId,
        subscribe,
        sendMessage,
        reconnect
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  return useContext(WebSocketContext);
}

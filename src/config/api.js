// For tunnels, mobile devices, and production domains, always route through relative /api proxy
const isRemoteOrTunnel = typeof window !== 'undefined' && 
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1';

export const API_BASE_URL = isRemoteOrTunnel 
  ? '/api' 
  : (import.meta.env.VITE_API_BASE_URL || '/api');


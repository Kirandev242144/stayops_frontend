import { usePWAContext } from '../context/PWAContext';

/**
 * Hook exposing PWA install state, prompt trigger, updates, and connectivity.
 */
export function usePWA() {
  return usePWAContext();
}

export default usePWA;

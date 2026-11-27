/**
 * PWA Platform & Environment Detection Utilities
 * 
 * IMPORTANT ARCHITECTURAL DISTINCTION:
 * - isStandalone(): Checks solely whether the application is CURRENTLY RUNNING
 *   in standalone/fullscreen display mode (i.e. already installed and launched
 *   from home screen / app launcher).
 * - Installability cannot and must not be inferred from isStandalone().
 *   Per W3C & Chromium specifications, installability is exclusively governed
 *   by the browser engine and signaled via the 'beforeinstallprompt' event.
 *   React UI must never render custom install triggers unless 'beforeinstallprompt'
 *   has explicitly fired (or iOS Safari manual fallback).
 */

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true ||
    (typeof document !== 'undefined' && Boolean(document.referrer && document.referrer.includes('android-app://')))
  );
}

export function isIOS() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && !window.MSStream;
}

export function isMobile() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /android|iphone|ipad|ipod|mobile/i.test(ua);
}

export function isOnline() {
  if (typeof window === 'undefined') return true;
  return window.navigator.onLine !== false;
}

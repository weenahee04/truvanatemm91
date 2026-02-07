import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// Suppress browser extension errors (these don't affect functionality)
// Set up error handlers as early as possible
if (typeof window !== 'undefined') {
  // Helper to check if error is from browser extension
  const isExtensionError = (message: string, filename?: string, error?: any): boolean => {
    const msg = message || error?.message || '';
    const file = filename || error?.filename || '';
    const str = msg + ' ' + file;
    
    return (
      str.includes('Blocked a frame with origin') ||
      str.includes('Failed to read a named property') ||
      str.includes('SecurityError') ||
      str.includes('inpage.js') ||
      str.includes('extension://') ||
      str.includes('chrome-extension://') ||
      str.includes('moz-extension://') ||
      str.includes('content-script') ||
      str.includes('truvamate-9e0fa.firebaseapp.com') ||
      str.includes('isRisk') ||
      error?.name === 'SecurityError'
    );
  };

  // Suppress SecurityError from browser extensions
  window.addEventListener('error', (event) => {
    if (isExtensionError(event.message || '', event.filename, event.error)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return true;
    }
  }, true);

  // Suppress unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || reason?.stack || String(reason) || '';
    
    if (isExtensionError(message, undefined, reason)) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);

  // Override console.error to filter extension errors
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
    if (isExtensionError(message)) {
      return; // Don't log extension errors
    }
    originalConsoleError.apply(console, args);
  };

  // Override console.warn for extension warnings
  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
    if (isExtensionError(message) || message.includes('isRisk')) {
      return; // Don't log extension warnings
    }
    originalConsoleWarn.apply(console, args);
  };

  // Also catch errors at window.onerror level (backup)
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (isExtensionError(String(message), source, error)) {
      return true; // Suppress the error
    }
    if (originalOnError) {
      return originalOnError.call(window, message, source, lineno, colno, error);
    }
    return false;
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
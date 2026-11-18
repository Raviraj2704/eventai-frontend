// ============================================================================
// React App Entry Point
// ============================================================================
// File: src/main.jsx
// Purpose: Initialize React application
// Status: Production-Ready ✅

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://c1d808e55e9fa75d2c4940865c6bf935@o4512224978993152.ingest.us.sentry.io/4512453148409856",
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.2,
});

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register Service Worker for Offline Support & PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ ServiceWorker registered with scope: ', registration.scope);
      })
      .catch((error) => {
        console.error('❌ ServiceWorker registration failed: ', error);
      });
  });
}
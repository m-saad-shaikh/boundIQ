import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ── Capacitor SplashScreen: auto-hide after app is ready ─────────────────────
// On web this is a no-op. On Android APK it hides the native splash screen
// smoothly once React has finished rendering.
async function initApp() {
  // Dynamically import SplashScreen only in Capacitor environment
  if (window.Capacitor || window.location.protocol === 'capacitor:') {
    try {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      // Hide splash screen with a fade after app mounts
      await SplashScreen.hide({ fadeOutDuration: 300 });
    } catch (e) {
      // Not in Capacitor — safely ignore
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Hide splash screen after React renders
initApp();

/**
 * App.jsx — Root router + global state
 * Updated: Task 2 (share route), Task 3 (AuthProvider), Task 8 (localStorage API key)
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage   from './pages/LandingPage.jsx';
import UploadPage    from './pages/UploadPage.jsx';
import ResultsPage   from './pages/ResultsPage.jsx';
import SharePage     from './pages/SharePage.jsx';
import { useAnalysis } from './hooks/useAnalysis.js';
import { AuthProvider } from './contexts/AuthContext.jsx';

// ── localStorage key for API key persistence (Task 8) ─────────────────────────
const STORAGE_KEY_API = 'bondiq_gemini_api_key';

export default function App() {
  const analysis = useAnalysis();

  // ── API Key: load from localStorage first, fall back to env ─────────────────
  const [apiKey, setApiKeyState] = useState(() => {
    // Try localStorage first (user previously entered a key)
    const stored = localStorage.getItem(STORAGE_KEY_API);
    if (stored && stored.length > 10) return stored;

    // Fall back to .env key (for dev convenience)
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey && envKey !== 'your_gemini_api_key_here' && envKey.length > 10) return envKey;

    return '';
  });

  // ── Provider state: load from localStorage ──────────────────────────────────
  const [provider, setProviderState] = useState(() => {
    return localStorage.getItem('bondiq_ai_provider') || 'gemini';
  });

  const setProvider = (prov) => {
    setProviderState(prov);
    localStorage.setItem('bondiq_ai_provider', prov);
  };

  // Persist API key to localStorage on change
  const setApiKey = (key) => {
    setApiKeyState(key);
    if (key && key.trim().length > 10) {
      localStorage.setItem(STORAGE_KEY_API, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_API);
    }
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route
            path="/analyze"
            element={
              <UploadPage
                analysis={analysis}
                apiKey={apiKey}
                setApiKey={setApiKey}
                provider={provider}
                setProvider={setProvider}
              />
            }
          />

          <Route
            path="/results"
            element={
              analysis.isDone
                ? <ResultsPage analysis={analysis} />
                : <Navigate to="/analyze" replace />
            }
          />

          {/* Task 2: Persistent share page */}
          <Route path="/share/:id" element={<SharePage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

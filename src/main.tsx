import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Clean up old localStorage items to free up quota since we migrated to IndexedDB
try {
  localStorage.removeItem('aura-voice-projects');
  localStorage.removeItem('aura-generation-store');
} catch (e) {
  console.warn('Failed to clear old localStorage keys:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

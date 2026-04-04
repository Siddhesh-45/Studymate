import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

// Global reset — removes default browser margins
const globalStyle = document.createElement('style');
globalStyle.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { font-family: 'Inter','Segoe UI', system-ui, -apple-system, sans-serif; background: transparent; }
  input::placeholder { color: var(--sm-surface-30); }

  /* Page transitions — all anchors/links fade between routes */
  [data-theme="light"] input::placeholder { color: rgba(0,0,0,0.3); }

  /* Scrollbar — subtle, matches dark theme */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--sm-surface-10); border-radius: 3px; }
  [data-theme="light"]::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); }
`;
document.head.appendChild(globalStyle);
document.body.style.background = "transparent";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);

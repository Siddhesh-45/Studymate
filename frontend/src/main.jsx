import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Global reset — removes default browser margins
const globalStyle = document.createElement('style');
globalStyle.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
  input::placeholder { color: rgba(255,255,255,0.3); }
`;
document.head.appendChild(globalStyle);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

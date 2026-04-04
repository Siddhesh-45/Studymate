import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { THEMES, themes } from '../theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Read saved preference (default: dark)
  const [mode, setMode] = useState(
    () => localStorage.getItem('sm-theme') || 'dark'
  );

  // Inject CSS vars whenever mode changes
  const applyTheme = useCallback((m) => {
    const tokens = THEMES[m];
    const root   = document.documentElement;
    Object.entries(tokens).forEach(([prop, val]) => root.style.setProperty(prop, val));
    root.setAttribute('data-theme', m);
    localStorage.setItem('sm-theme', m);
    // Add tailwind dark mode class
    if (m === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  useEffect(() => { applyTheme(mode); }, [mode, applyTheme]);

  const toggleTheme = () => setMode(prev => prev === 'dark' ? 'light' : 'dark');

  const theme = themes[mode] || themes.dark;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};

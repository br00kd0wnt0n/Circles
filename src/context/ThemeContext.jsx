import { createContext, useContext, useState, useEffect } from 'react';
import { themes, getNextTheme } from '../constants/themes';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    try {
      const saved = localStorage.getItem('circles-theme');
      return saved && themes[saved] ? saved : 'midnight';
    } catch {
      return 'midnight';
    }
  });

  const theme = themes[themeId];

  useEffect(() => {
    try {
      localStorage.setItem('circles-theme', themeId);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  }, [themeId]);

  const cycleTheme = () => {
    setThemeId(getNextTheme(themeId));
  };

  return (
    <ThemeContext.Provider value={{ theme, themeId, cycleTheme, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

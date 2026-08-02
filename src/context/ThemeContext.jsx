import { createContext, useContext, useEffect, useState } from 'react';

const THEMES = ['light', 'dark', 'outdoor'];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('travel-planner-theme');
    return THEMES.includes(saved) ? saved : 'light';
  });

  useEffect(() => {
    localStorage.setItem('travel-planner-theme', theme);
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-outdoor');
    document.body.classList.add(`theme-${theme}`);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = theme === 'dark' ? '#0f172a' : theme === 'outdoor' ? '#F5F0E8' : '#f8fafc';
    }
  }, [theme]);

  const cycleTheme = () => {
    setTheme((prev) => {
      const idx = THEMES.indexOf(prev);
      return THEMES[(idx + 1) % THEMES.length];
    });
  };

  const themeLabel = {
    light: 'Light',
    dark: 'Dark',
    outdoor: 'Outdoor',
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, themeLabel }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

export function useDarkMode() {
  // If ThemeProvider is available, prefer that centralized state
  try {
    const ctx = useTheme();
    return { isDarkMode: ctx.isDark, toggleDarkMode: ctx.toggle, setIsDarkMode: ctx.setDark };
  } catch (e) {
    // Fallback to local implementation when ThemeProvider is not present
    const [isDarkMode, setIsDarkMode] = useState(() => {
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('theme');
          if (saved) return saved === 'dark';
        } catch {}
        return document.documentElement.classList.contains('dark');
      }
      return false;
    });

    useEffect(() => {
      const root = document.documentElement;
      if (isDarkMode) {
        root.classList.add('dark');
        try { localStorage.setItem('theme', 'dark'); } catch {}
      } else {
        root.classList.remove('dark');
        try { localStorage.setItem('theme', 'light'); } catch {}
      }
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode((s) => !s);

    return { isDarkMode, toggleDarkMode, setIsDarkMode };
  }
}

import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeContextValue = {
  isDark: boolean;
  toggle: () => void;
  setDark: (value: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
      } catch {}
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {}
  }, [isDark]);

  const toggle = () => setIsDark((s) => !s);
  const setDark = (v: boolean) => setIsDark(v);

  return (
    <ThemeContext.Provider value={{ isDark, toggle, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

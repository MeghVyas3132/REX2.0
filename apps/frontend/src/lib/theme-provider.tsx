'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const applyThemeToDom = (targetTheme: Theme) => {
    const html = document.documentElement;

    if (targetTheme === 'dark') {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
      setResolvedTheme('dark');
      return;
    }

    if (targetTheme === 'light') {
      html.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
      setResolvedTheme('light');
      return;
    }

    html.removeAttribute('data-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      html.classList.add('dark');
      setResolvedTheme('dark');
    } else {
      html.classList.remove('dark');
      setResolvedTheme('light');
    }
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = storedTheme || 'system';
    setThemeState(initialTheme);
    applyThemeToDom(initialTheme);

    const updateResolvedTheme = () => {
      setThemeState((current) => {
        if (current === 'system') {
          applyThemeToDom('system');
        }
        return current;
      });
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateResolvedTheme);

    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyThemeToDom(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

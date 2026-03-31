import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';

const ADMIN_THEME_STORAGE_KEY = 'buysial-admin-theme';
const AdminThemeContext = createContext(null);

function readStoredTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
  return storedTheme === 'dark' ? 'dark' : 'light';
}

export function AdminThemeProvider({ children, defaultTheme = 'light' }) {
  const [theme, setTheme] = useState(() => {
    const storedTheme = readStoredTheme();
    return storedTheme || defaultTheme;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
    document.documentElement.style.colorScheme = theme;

    return () => {
      document.documentElement.style.colorScheme = 'dark';
    };
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme: () => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark')),
    }),
    [theme]
  );

  return createElement(AdminThemeContext.Provider, { value }, children);
}

export function useAdminTheme() {
  return useContext(AdminThemeContext) || {
    theme: 'dark',
    isDark: true,
    setTheme: () => {},
    toggleTheme: () => {},
  };
}

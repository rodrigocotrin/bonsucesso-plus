import React, { createContext, useContext, useEffect, useState } from 'react';
import { FontScale, ThemeMode } from '../types';

interface AccessibilityContextValue {
  theme: ThemeMode;
  fontScale: FontScale;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setFontScale: (scale: FontScale) => void;
  cycleFontScale: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'integracurso_theme';
const FONT_SCALE_STORAGE_KEY = 'integracurso_font_scale';

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'dark' || saved === 'light' ? saved : 'light'; // Modo Claro acolhedor como padrão
  });

  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    const saved = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    return saved === 'normal' || saved === 'large' || saved === 'xlarge' ? saved : 'normal';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-font-scale', fontScale);
    localStorage.setItem(FONT_SCALE_STORAGE_KEY, fontScale);
  }, [fontScale]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const setFontScale = (scale: FontScale) => {
    setFontScaleState(scale);
  };

  const cycleFontScale = () => {
    setFontScaleState((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'normal';
    });
  };

  return (
    <AccessibilityContext.Provider
      value={{
        theme,
        fontScale,
        toggleTheme,
        setTheme,
        setFontScale,
        cycleFontScale,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility deve ser utilizado dentro de um AccessibilityProvider');
  }
  return context;
}

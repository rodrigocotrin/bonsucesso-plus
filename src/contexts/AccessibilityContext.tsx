import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FontScale, ResolvedTheme, ThemeMode } from '../types';

export interface AccessibilityContextValue {
  /** Preferência selecionada pelo usuário ('light' | 'dark' | 'system') */
  theme: ThemeMode;
  /** Tema efetivamente aplicado ao DOM ('light' | 'dark') */
  resolvedTheme: ResolvedTheme;
  fontScale: FontScale;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setFontScale: (scale: FontScale) => void;
  cycleFontScale: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

export const THEME_STORAGE_KEY = 'bonsucesso-theme';
const FONT_SCALE_STORAGE_KEY = 'integracurso_font_scale';

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveThemeMode(mode: ThemeMode, systemDark: boolean): ResolvedTheme {
  if (mode === 'system') {
    return systemDark ? 'dark' : 'light';
  }
  return mode;
}

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    getSystemPrefersDark()
  );

  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    try {
      const saved = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
      return saved === 'normal' || saved === 'large' || saved === 'xlarge' ? saved : 'normal';
    } catch {
      return 'normal';
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    setSystemPrefersDark(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme = resolveThemeMode(theme, systemPrefersDark);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = resolvedTheme === 'dark';

    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0C0D10' : '#FAF9F6');
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme, resolvedTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-font-scale', fontScale);
    try {
      localStorage.setItem(FONT_SCALE_STORAGE_KEY, fontScale);
    } catch {
      // ignore storage errors
    }
  }, [fontScale]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const currentResolved = resolveThemeMode(prev, systemPrefersDark);
      return currentResolved === 'dark' ? 'light' : 'dark';
    });
  }, [systemPrefersDark]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
  }, []);

  const setFontScale = useCallback((scale: FontScale) => {
    setFontScaleState(scale);
  }, []);

  const cycleFontScale = useCallback(() => {
    setFontScaleState((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'normal';
    });
  }, []);

  const contextValue = useMemo<AccessibilityContextValue>(
    () => ({
      theme,
      resolvedTheme,
      fontScale,
      toggleTheme,
      setTheme,
      setFontScale,
      cycleFontScale,
    }),
    [theme, resolvedTheme, fontScale, toggleTheme, setTheme, setFontScale, cycleFontScale]
  );

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

/** Alias semântico de ThemeProvider conforme contrato de Dark Mode */
export const ThemeProvider = AccessibilityProvider;

export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility deve ser utilizado dentro de um AccessibilityProvider');
  }
  return context;
}

/** Hook semântico useTheme() para controle de aparência (Claro | Escuro | Sistema) */
export function useTheme() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useAccessibility();
  return { theme, resolvedTheme, setTheme, toggleTheme };
}

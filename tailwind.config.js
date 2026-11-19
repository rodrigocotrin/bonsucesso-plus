/**
 * Bonsucesso+ — Design Tokens Semânticos (Bauhaus Suíço — Claro & "Quadro-Negro Suíço" Dark Mode)
 *
 * Todas as cores apontam para variáveis CSS semânticas declaradas em `src/index.css` (:root e html.dark),
 * permitindo que todas as páginas, gráficos, tabelas, modais e drawers se adaptem automaticamente.
 */

const TOKENS = {
  paper: 'rgb(var(--rgb-paper) / <alpha-value>)',
  surface: 'rgb(var(--rgb-surface) / <alpha-value>)',
  subtle: 'rgb(var(--rgb-subtle) / <alpha-value>)',
  track: 'rgb(var(--rgb-track) / <alpha-value>)',
  searchBg: 'rgb(var(--rgb-search) / <alpha-value>)',

  cta: 'var(--cta-bg)',
  ctaFg: 'var(--cta-fg)',
  ctaHover: 'var(--cta-hover)',

  ink: 'rgb(var(--rgb-ink) / <alpha-value>)',
  muted: 'rgb(var(--rgb-muted) / <alpha-value>)',

  line: 'var(--border-line)',
  lineStrong: 'var(--border-strong)',
  backdrop: 'var(--backdrop-overlay)',

  blue: 'var(--academic-fg)',
  blueBg: 'var(--academic-bg)',
  blueBorder: 'var(--academic-border)',

  green: 'var(--progress-fg)',
  greenBg: 'var(--progress-bg)',
  greenBorder: 'var(--progress-border)',

  yellow: 'var(--assess-fg)',
  yellowBg: 'var(--assess-bg)',
  yellowBorder: 'var(--assess-border)',
  yellowInk: 'var(--assess-ink)',

  red: 'var(--critical-fg)',
  redBg: 'var(--critical-bg)',
  redBorder: 'var(--critical-border)',
};

const scale = (light, mid, strong, extra = {}) => ({
  50: light,
  100: light,
  200: mid,
  300: mid,
  400: strong,
  500: strong,
  600: strong,
  700: strong,
  800: strong,
  900: strong,
  950: strong,
  ...extra,
});

const neutralBridge = {
  50: TOKENS.subtle,
  100: TOKENS.searchBg,
  200: TOKENS.line,
  300: TOKENS.line,
  400: TOKENS.muted,
  500: TOKENS.muted,
  600: TOKENS.muted,
  700: TOKENS.ink,
  800: TOKENS.ink,
  900: TOKENS.ink,
  950: TOKENS.ink,
};

const inkBridge = {
  50: TOKENS.subtle,
  100: TOKENS.track,
  200: TOKENS.line,
  300: TOKENS.line,
  400: TOKENS.muted,
  500: TOKENS.muted,
  600: TOKENS.ink,
  700: TOKENS.ink,
  800: TOKENS.ink,
  900: TOKENS.ink,
  950: TOKENS.ink,
};

const blueBridge = scale(TOKENS.blueBg, TOKENS.blueBorder, TOKENS.blue);
const greenBridge = scale(TOKENS.greenBg, TOKENS.greenBorder, TOKENS.green);
const redBridge = scale(TOKENS.redBg, TOKENS.redBorder, TOKENS.red);
const yellowBridge = scale(TOKENS.yellowBg, TOKENS.yellowBorder, TOKENS.yellow, {
  700: TOKENS.yellowInk,
  800: TOKENS.yellowInk,
  900: TOKENS.yellowInk,
  950: TOKENS.yellowInk,
});

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      white: TOKENS.surface,
      black: TOKENS.cta,

      paper: TOKENS.paper,
      surface: TOKENS.surface,
      subtle: TOKENS.subtle,
      track: TOKENS.track,
      search: TOKENS.searchBg,
      backdrop: TOKENS.backdrop,
      cta: {
        DEFAULT: TOKENS.cta,
        fg: TOKENS.ctaFg,
        hover: TOKENS.ctaHover,
      },
      ink: {
        DEFAULT: TOKENS.ink,
        hover: TOKENS.ctaHover,
        muted: TOKENS.muted,
      },
      line: {
        DEFAULT: TOKENS.line,
        strong: TOKENS.lineStrong,
      },
      academic: {
        DEFAULT: TOKENS.blue,
        bg: TOKENS.blueBg,
        border: TOKENS.blueBorder,
      },
      progress: {
        DEFAULT: TOKENS.green,
        bg: TOKENS.greenBg,
        border: TOKENS.greenBorder,
      },
      assess: {
        DEFAULT: TOKENS.yellow,
        bg: TOKENS.yellowBg,
        border: TOKENS.yellowBorder,
        ink: TOKENS.yellowInk,
      },
      critical: {
        DEFAULT: TOKENS.red,
        bg: TOKENS.redBg,
        border: TOKENS.redBorder,
      },

      // Pontes de compatibilidade semânticas (adaptam-se automaticamente via CSS variables)
      slate: neutralBridge,
      gray: neutralBridge,
      zinc: neutralBridge,
      neutral: neutralBridge,
      stone: neutralBridge,
      primary: inkBridge,
      teal: inkBridge,
      secondary: blueBridge,
      blue: blueBridge,
      indigo: blueBridge,
      sky: blueBridge,
      cyan: blueBridge,
      violet: blueBridge,
      purple: blueBridge,
      success: greenBridge,
      emerald: greenBridge,
      green: greenBridge,
      warning: yellowBridge,
      amber: yellowBridge,
      yellow: yellowBridge,
      orange: yellowBridge,
      danger: redBridge,
      red: redBridge,
      rose: redBridge,
    },

    spacing: {
      px: '1px',
      0: '0px',
      0.5: '2px',
      1: '4px',
      1.5: '6px',
      2: '8px',
      2.5: '10px',
      3: '12px',
      3.5: '14px',
      4: '16px',
      5: '20px',
      6: '24px',
      7: '28px',
      8: '32px',
      9: '36px',
      10: '40px',
      11: '44px',
      12: '48px',
      14: '56px',
      16: '64px',
      20: '80px',
      24: '96px',
      28: '112px',
      32: '128px',
      36: '144px',
      40: '160px',
      44: '176px',
      48: '192px',
      52: '208px',
      56: '224px',
      60: '240px',
      64: '256px',
      72: '288px',
      80: '320px',
      96: '384px',
    },

    borderRadius: {
      none: '0px',
      sm: '2px',
      DEFAULT: '4px',
      md: '6px',
      lg: '8px',
      xl: '8px',
      '2xl': '8px',
      '3xl': '8px',
      full: '9999px',
    },

    boxShadow: {
      none: 'none',
      xs: '0 1px 2px 0 rgba(0,0,0,0.06)',
      sm: '0 1px 2px 0 rgba(0,0,0,0.06)',
      DEFAULT: '0 1px 2px 0 rgba(0,0,0,0.06)',
      md: '0 1px 2px 0 rgba(0,0,0,0.06)',
      lg: '0 1px 2px 0 rgba(0,0,0,0.06)',
      xl: '0 1px 2px 0 rgba(0,0,0,0.06)',
      '2xl': '0 1px 2px 0 rgba(0,0,0,0.06)',
      inner: 'none',
    },

    backgroundImage: {
      none: 'none',
    },

    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.5' }],
        lg: ['1.125rem', { lineHeight: '1.4' }],
        xl: ['1.25rem', { lineHeight: '1.35' }],
        '2xl': ['1.5rem', { lineHeight: '1.25' }],
        '3xl': ['1.875rem', { lineHeight: '1.2' }],
        '4xl': ['2.25rem', { lineHeight: '1.15' }],
      },
      lineHeight: {
        relaxed: '1.5',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      keyframes: {
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 200ms cubic-bezier(0.2, 0, 0, 1)',
        'fade-in': 'fade-in 150ms ease-out',
      },
    },
  },
  plugins: [],
};

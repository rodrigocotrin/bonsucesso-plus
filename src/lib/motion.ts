import type { Transition, Variants } from 'framer-motion';

/**
 * Sistema Global de Motion Design e Micro-Interações — Bonsucesso+
 *
 * REGRAS DE OURO:
 * - GPU-only: anima exclusivamente `transform` (`x`, `y`, `scale`, `scaleX`) e `opacity`.
 * - Zero bounce/elástico: curva `cubic-bezier(0.22, 1, 0.36, 1)` e spring firme (`stiffness: 500, damping: 38, mass: 0.8`).
 * - Nenhuma transição bloqueante acima de 250ms (exceto scaleX puramente visual de barras de progresso em 350ms).
 */

export const EASINGS = {
  /** Curva padrão Snappy & Tactile: cubic-bezier(0.22, 1, 0.36, 1) */
  snappy: [0.22, 1, 0.36, 1] as const,
};

export const DURATIONS = {
  micro: 0.13, // 130ms — hover, foco, clique
  overlay: 0.16, // 160ms — modais, dropdowns
  toastEnter: 0.18, // 180ms — entrada de toasts
  toastExit: 0.12, // 120ms — saída de toasts
  pageEnter: 0.18, // 180ms — entrada de páginas/abas
  pageExit: 0.10, // 100ms — saída rápida de páginas/abas
  drawerEnter: 0.22, // 220ms — SlideOverDrawer
  drawerExit: 0.18, // 180ms — fechamento do SlideOverDrawer
  progressBar: 0.35, // 350ms — preenchimento scaleX (transform-origin: left)
} as const;

export const SPRINGS = {
  /** Spring rápido, firme e com zero bounce para indicadores deslizantes (layoutId) */
  indicator: {
    type: 'spring',
    stiffness: 500,
    damping: 38,
    mass: 0.8,
  } satisfies Transition,
} as const;

export const TRANSITIONS = {
  micro: {
    duration: DURATIONS.micro,
    ease: EASINGS.snappy,
  } satisfies Transition,
  overlay: {
    duration: DURATIONS.overlay,
    ease: EASINGS.snappy,
  } satisfies Transition,
  drawer: {
    duration: DURATIONS.drawerEnter,
    ease: EASINGS.snappy,
  } satisfies Transition,
  progressBar: {
    duration: DURATIONS.progressBar,
    ease: EASINGS.snappy,
  } satisfies Transition,
} as const;

export const VARIANTS = {
  /** Transição de página e conteúdo de abas (aplicada apenas ao <main>, nunca na Sidebar/Topbar) */
  page: {
    initial: { opacity: 0, y: 6 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATIONS.pageEnter, ease: EASINGS.snappy },
    },
    exit: {
      opacity: 0,
      transition: { duration: DURATIONS.pageExit, ease: EASINGS.snappy },
    },
  } satisfies Variants,

  /** Container de KPI Cards com stagger máximo de 30ms entre cards */
  kpiStaggerContainer: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.03,
      },
    },
  } satisfies Variants,

  /** Item individual de MetricCard (y: 8 -> 0, opacity: 0 -> 1) */
  kpiCard: {
    initial: { opacity: 0, y: 8 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATIONS.pageEnter, ease: EASINGS.snappy },
    },
  } satisfies Variants,

  /** Backdrop de Modal e SlideOverDrawer (150ms) */
  backdrop: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.15, ease: EASINGS.snappy },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.12, ease: EASINGS.snappy },
    },
  } satisfies Variants,

  /** Painel de Modal (opacity: 0 -> 1, scale: 0.96 -> 1 em 160ms) */
  modalPanel: {
    initial: { opacity: 0, scale: 0.96 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: DURATIONS.overlay, ease: EASINGS.snappy },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: { duration: 0.12, ease: EASINGS.snappy },
    },
  } satisfies Variants,

  /** Painel lateral do SlideOverDrawer (x: '100%' -> 0 em 220ms) */
  drawerPanel: {
    initial: { x: '100%' },
    animate: {
      x: 0,
      transition: { duration: DURATIONS.drawerEnter, ease: EASINGS.snappy },
    },
    exit: {
      x: '100%',
      transition: { duration: DURATIONS.drawerExit, ease: EASINGS.snappy },
    },
  } satisfies Variants,

  /** Painel lateral esquerdo do Drawer Mobile */
  mobileDrawerLeft: {
    initial: { x: '-100%' },
    animate: {
      x: 0,
      transition: { duration: DURATIONS.drawerEnter, ease: EASINGS.snappy },
    },
    exit: {
      x: '-100%',
      transition: { duration: DURATIONS.drawerExit, ease: EASINGS.snappy },
    },
  } satisfies Variants,

  /** Toast Notification (entra y: 12 -> 0 em 180ms, sai em fade 120ms) */
  toast: {
    initial: { opacity: 0, y: 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATIONS.toastEnter, ease: EASINGS.snappy },
    },
    exit: {
      opacity: 0,
      transition: { duration: DURATIONS.toastExit, ease: EASINGS.snappy },
    },
  } satisfies Variants,

  /** Popover / Dropdown leve (160ms) */
  popover: {
    initial: { opacity: 0, y: 4, scale: 0.98 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: DURATIONS.overlay, ease: EASINGS.snappy },
    },
    exit: {
      opacity: 0,
      y: 2,
      scale: 0.98,
      transition: { duration: 0.11, ease: EASINGS.snappy },
    },
  } satisfies Variants,
} as const;

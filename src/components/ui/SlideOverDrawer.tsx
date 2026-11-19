import React, { useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/formatters';
import { SPRINGS, VARIANTS } from '../../lib/motion';
import { useFocusTrap } from './useFocusTrap';

export interface SlideOverDrawerTab {
  id: string;
  label: string;
  badgeCount?: number;
}

export interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  headerBadge?: React.ReactNode;
  tabs?: SlideOverDrawerTab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
  /** Se true, solicita confirmação rápida antes de descartar alterações não salvas */
  isDirty?: boolean;
}

const WIDTH_CLASSES: Record<NonNullable<SlideOverDrawerProps['width']>, string> = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

/**
 * Slide-Over Drawer (Seção 2.D):
 * - Backdrop: opacity 0 -> 1 (150ms) com backdrop-blur-[2px].
 * - Painel lateral: x: '100%' -> 0 (220ms, cubic-bezier(0.22, 1, 0.36, 1)).
 * - Tabs internas com indicador deslizante via layoutId.
 */
export const SlideOverDrawer: React.FC<SlideOverDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  eyebrow,
  headerBadge,
  tabs,
  activeTabId,
  onTabChange,
  children,
  footer,
  width = 'lg',
  isDirty = false,
}) => {
  const titleId = useId();
  const drawerTabGroupId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleRequestClose = () => {
    if (
      isDirty &&
      !window.confirm('Existem alterações não salvas. Deseja realmente descartar?')
    ) {
      return;
    }
    onClose();
  };

  useFocusTrap(isOpen, drawerRef, handleRequestClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="drawer-backdrop"
          variants={VARIANTS.backdrop}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 flex justify-end overflow-hidden bg-backdrop backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleRequestClose();
          }}
        >
          <motion.div
            key="drawer-panel"
            ref={drawerRef}
            variants={VARIANTS.drawerPanel}
            initial="initial"
            animate="animate"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={cn(
              'relative flex h-full max-h-[100dvh] w-full max-w-full flex-col overflow-hidden border-l border-line bg-surface',
              WIDTH_CLASSES[width]
            )}
          >
            {/* Cabeçalho */}
            <div className="border-b border-line px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  {eyebrow && <div className="eyebrow truncate">{eyebrow}</div>}
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id={titleId} className="break-words text-lg font-semibold tracking-tight text-ink">
                      {title}
                    </h2>
                    {headerBadge}
                  </div>
                  {subtitle && <div className="break-words text-sm text-ink-muted">{subtitle}</div>}
                </div>

                <button
                  type="button"
                  onClick={handleRequestClose}
                  aria-label="Fechar painel lateral"
                  title="Fechar painel lateral"
                  className="-mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-ink-muted transition-all duration-150 ease-out hover:bg-subtle hover:text-ink active:scale-95"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Abas Internas com Indicador Deslizante (layoutId) */}
              {tabs && tabs.length > 0 && (
                <div
                  role="tablist"
                  aria-label="Seções do registro"
                  className="no-scrollbar -mb-4 mt-4 flex w-full max-w-full gap-5 overflow-x-auto border-t border-line pt-2"
                >
                  {tabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onTabChange?.(tab.id)}
                        className={cn(
                          'relative inline-flex h-10 shrink-0 items-center gap-2 px-1 text-sm transition-colors duration-150',
                          isActive
                            ? 'font-semibold text-ink'
                            : 'font-medium text-ink-muted hover:text-ink'
                        )}
                      >
                        <span>{tab.label}</span>
                        {typeof tab.badgeCount === 'number' && (
                          <span className="num rounded bg-subtle px-1.5 py-0.5 text-xs text-ink">
                            {tab.badgeCount}
                          </span>
                        )}
                        {isActive && (
                          <motion.span
                            layoutId={`drawer-tab-underline-${drawerTabGroupId}`}
                            transition={SPRINGS.indicator}
                            className="absolute inset-x-0 bottom-0 h-0.5 bg-ink"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Corpo com transição suave entre abas internas */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTabId ?? 'default'}
                  variants={VARIANTS.page}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>

            {footer && (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-paper px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

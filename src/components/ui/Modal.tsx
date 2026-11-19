import React, { useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/formatters';
import { VARIANTS } from '../../lib/motion';
import { useFocusTrap } from './useFocusTrap';
import { SemanticTone, TONE_FILL } from './tones';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  tone?: SemanticTone;
  /** Se true, solicita confirmação rápida antes de descartar alterações não salvas */
  isDirty?: boolean;
}

const SIZE: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

/**
 * Modal com animação GPU-only (backdrop opacity 0->1 em 150ms + dialog scale 0.96->1 em 160ms).
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  tone,
  isDirty = false,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleRequestClose = () => {
    if (
      isDirty &&
      !window.confirm('Existem alterações não salvas. Deseja realmente descartar?')
    ) {
      return;
    }
    onClose();
  };

  useFocusTrap(isOpen, dialogRef, handleRequestClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          variants={VARIANTS.backdrop}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-backdrop backdrop-blur-[2px] p-3 sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleRequestClose();
          }}
        >
          <motion.div
            key="modal-panel"
            ref={dialogRef}
            variants={VARIANTS.modalPanel}
            initial="initial"
            animate="animate"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            className={cn(
              'relative flex max-h-[90dvh] w-full max-w-full flex-col overflow-hidden rounded-lg border border-line bg-surface',
              SIZE[size]
            )}
          >
            {tone && (
              <span
                className={cn('absolute inset-x-0 top-0 h-1', TONE_FILL[tone])}
                aria-hidden="true"
              />
            )}

            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div className="min-w-0 space-y-1">
                <h2 id={titleId} className="text-lg font-semibold tracking-tight text-ink">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="text-sm text-ink-muted">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleRequestClose}
                aria-label="Fechar modal"
                title="Fechar modal"
                className="-mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-ink-muted transition-all duration-150 ease-out hover:bg-subtle hover:text-ink active:scale-95"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">{children}</div>

            {footer && (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

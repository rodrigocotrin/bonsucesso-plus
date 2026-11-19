import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, X } from 'lucide-react';
import { cn } from '../../utils/formatters';
import { VARIANTS } from '../../lib/motion';
import { SemanticTone, TONE_FILL, TONE_TEXT } from './tones';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export interface ToastNotificationProps extends ToastItem {
  onDismiss: (id: string) => void;
}

const TOAST_CONFIG: Record<
  ToastVariant,
  { tone: SemanticTone; Icon: typeof Info; prefix: string }
> = {
  info: { tone: 'academic', Icon: Info, prefix: 'Informação:' },
  success: { tone: 'progress', Icon: CheckCircle2, prefix: 'Confirmado:' },
  warning: { tone: 'assess', Icon: AlertTriangle, prefix: 'Atenção:' },
  error: { tone: 'critical', Icon: OctagonAlert, prefix: 'Erro:' },
};

/**
 * Toast Notification (Seção 2.D):
 * Entra deslizando de baixo para cima (y: 12 -> 0, opacity: 0 -> 1 em 180ms)
 * e sai com fade rápido (120ms).
 */
export const ToastNotification: React.FC<ToastNotificationProps> = ({
  id,
  title,
  description,
  variant = 'info',
  onDismiss,
}) => {
  const { tone, Icon, prefix } = TOAST_CONFIG[variant];

  return (
    <motion.div
      layout
      variants={VARIANTS.toast}
      initial="initial"
      animate="animate"
      exit="exit"
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      aria-live="polite"
      className="pointer-events-auto relative flex w-full max-w-md items-start justify-between gap-3 overflow-hidden rounded-lg border border-line bg-surface py-3 pl-5 pr-3 shadow-sm"
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', TONE_FILL[tone])} aria-hidden="true" />

      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', TONE_TEXT[tone])} aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug text-ink">
            <span className="sr-only">{prefix} </span>
            {title}
          </p>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{description}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Fechar notificação"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted transition-all duration-150 ease-out hover:bg-subtle hover:text-ink active:scale-95"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </motion.div>
  );
};

export interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-label="Notificações do sistema"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-md flex-col gap-2 px-4 sm:px-0"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastNotification key={toast.id} {...toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

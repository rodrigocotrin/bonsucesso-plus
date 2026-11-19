import React from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, X } from 'lucide-react';
import { cn } from '../../utils/formatters';

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

const TOAST_STYLES: Record<
  ToastVariant,
  {
    wrapper: string;
    icon: React.ReactNode;
    prefix: string;
  }
> = {
  info: {
    wrapper:
      'border-secondary-600 bg-white text-slate-900 dark:border-secondary-400 dark:bg-slate-900 dark:text-slate-100',
    icon: <Info className="h-6 w-6 text-secondary-700 dark:text-secondary-400 shrink-0" aria-hidden="true" />,
    prefix: 'Informação:',
  },
  success: {
    wrapper:
      'border-success-700 bg-white text-slate-900 dark:border-emerald-500 dark:bg-slate-900 dark:text-slate-100',
    icon: <CheckCircle2 className="h-6 w-6 text-success-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />,
    prefix: 'Sucesso:',
  },
  warning: {
    wrapper:
      'border-warning-700 bg-white text-slate-900 dark:border-amber-500 dark:bg-slate-900 dark:text-slate-100',
    icon: <AlertTriangle className="h-6 w-6 text-warning-700 dark:text-amber-400 shrink-0" aria-hidden="true" />,
    prefix: 'Atenção:',
  },
  error: {
    wrapper:
      'border-danger-700 bg-white text-slate-900 dark:border-red-500 dark:bg-slate-900 dark:text-slate-100',
    icon: <ShieldAlert className="h-6 w-6 text-danger-700 dark:text-red-400 shrink-0" aria-hidden="true" />,
    prefix: 'Erro:',
  },
};

/**
 * Notificação Toast individual — Heurística #1 de Nielsen (Visibilidade do Status do Sistema).
 * Sempre apresenta ícone + título + botão de fechar rotulado.
 */
export const ToastNotification: React.FC<ToastNotificationProps> = ({
  id,
  title,
  description,
  variant = 'info',
  onDismiss,
}) => {
  const style = TOAST_STYLES[variant];

  return (
    <div
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      aria-live="polite"
      className={cn(
        'pointer-events-auto flex w-full max-w-md items-start justify-between gap-3 rounded-2xl border-l-8 border border-slate-200 p-4 shadow-xl dark:border-slate-700 transition-all',
        style.wrapper
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5">{style.icon}</span>
        <div>
          <p className="text-base font-bold leading-snug">
            <span className="sr-only">{style.prefix} </span>
            {title}
          </p>
          {description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="inline-flex min-h-[38px] shrink-0 items-center gap-1 rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Fechar</span>
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notificações do sistema"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 w-full max-w-md px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

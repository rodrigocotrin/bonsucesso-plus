import React from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { cn } from '../../utils/formatters';

export type CalloutVariant = 'info' | 'success' | 'warning' | 'error';

export interface CalloutAlertProps {
  variant?: CalloutVariant;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const VARIANT_CONFIG: Record<
  CalloutVariant,
  {
    container: string;
    iconColor: string;
    label: string;
    icon: React.ReactNode;
    role: 'status' | 'alert';
  }
> = {
  info: {
    container:
      'bg-secondary-50 border-secondary-300 text-slate-900 dark:bg-secondary-950/60 dark:border-secondary-700 dark:text-slate-100',
    iconColor: 'text-secondary-700 dark:text-secondary-300',
    label: 'Informação:',
    icon: <Info className="h-6 w-6 shrink-0" aria-hidden="true" />,
    role: 'status',
  },
  success: {
    container:
      'bg-success-50 border-success-500/50 text-slate-900 dark:bg-success-900/30 dark:border-emerald-700 dark:text-slate-100',
    iconColor: 'text-success-700 dark:text-emerald-300',
    label: 'Tudo certo:',
    icon: <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden="true" />,
    role: 'status',
  },
  warning: {
    container:
      'bg-warning-50 border-warning-500/60 text-slate-900 dark:bg-warning-900/30 dark:border-amber-700 dark:text-slate-100',
    iconColor: 'text-warning-700 dark:text-amber-300',
    label: 'Atenção:',
    icon: <AlertTriangle className="h-6 w-6 shrink-0" aria-hidden="true" />,
    role: 'alert',
  },
  error: {
    container:
      'bg-danger-50 border-danger-500/60 text-slate-900 dark:bg-danger-900/30 dark:border-red-700 dark:text-slate-100',
    iconColor: 'text-danger-700 dark:text-red-300',
    label: 'Importante:',
    icon: <ShieldAlert className="h-6 w-6 shrink-0" aria-hidden="true" />,
    role: 'alert',
  },
};

/**
 * Aviso contextual acessível (info, success, warning, error).
 * Combina ícone explícito, prefixo textual e cores de alto contraste.
 */
export const CalloutAlert: React.FC<CalloutAlertProps> = ({
  variant = 'info',
  title,
  children,
  action,
  className,
}) => {
  const config = VARIANT_CONFIG[variant];

  return (
    <div
      role={config.role}
      className={cn(
        'rounded-2xl border-2 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4',
        config.container,
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className={cn('mt-0.5', config.iconColor)}>{config.icon}</span>
        <div className="space-y-1">
          <h4 className="text-base font-bold leading-snug">
            <span className="sr-only">{config.label} </span>
            {title}
          </h4>
          <div className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
            {children}
          </div>
        </div>
      </div>

      {action && <div className="shrink-0 sm:self-center">{action}</div>}
    </div>
  );
};

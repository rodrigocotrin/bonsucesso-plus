import React from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { cn } from '../../utils/formatters';

export type BadgeVariant = 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  showDefaultIcon?: boolean;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral:
    'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700',
  primary:
    'bg-primary-50 text-primary-900 border-primary-300 dark:bg-primary-950/80 dark:text-primary-200 dark:border-primary-700',
  secondary:
    'bg-secondary-50 text-secondary-900 border-secondary-300 dark:bg-secondary-950/80 dark:text-secondary-200 dark:border-secondary-700',
  success:
    'bg-success-50 text-success-900 border-success-500/40 dark:bg-success-900/40 dark:text-emerald-200 dark:border-emerald-700',
  warning:
    'bg-warning-50 text-warning-900 border-warning-500/50 dark:bg-warning-900/40 dark:text-amber-200 dark:border-amber-700',
  danger:
    'bg-danger-50 text-danger-900 border-danger-500/40 dark:bg-danger-900/40 dark:text-red-200 dark:border-red-700',
};

const DEFAULT_ICONS: Record<BadgeVariant, React.ReactNode> = {
  neutral: <Info className="h-4 w-4 shrink-0" aria-hidden="true" />,
  primary: <Info className="h-4 w-4 shrink-0" aria-hidden="true" />,
  secondary: <Info className="h-4 w-4 shrink-0" aria-hidden="true" />,
  success: <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />,
  danger: <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />,
};

/**
 * Componente Badge que nunca depende apenas da cor para comunicar status:
 * exibe ícone semântico + rótulo textual de alto contraste.
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  icon,
  showDefaultIcon = true,
  className,
  children,
  ...props
}) => {
  const renderedIcon = icon ?? (showDefaultIcon ? DEFAULT_ICONS[variant] : null);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold leading-snug max-w-full break-words',
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {renderedIcon}
      <span>{children}</span>
    </span>
  );
};

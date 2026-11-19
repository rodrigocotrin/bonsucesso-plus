import React from 'react';
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react';
import { cn } from '../../utils/formatters';
import { SemanticTone, TONE_FILL, TONE_SOFT, TONE_TEXT } from './tones';

export type CalloutVariant = 'info' | 'success' | 'warning' | 'error';

export interface CalloutAlertProps {
  variant?: CalloutVariant;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const VARIANT_CONFIG: Record<
  CalloutVariant,
  { tone: SemanticTone; label: string; Icon: typeof Info; role: 'status' | 'alert' }
> = {
  info: { tone: 'academic', label: 'Informação:', Icon: Info, role: 'status' },
  success: { tone: 'progress', label: 'Tudo certo:', Icon: CheckCircle2, role: 'status' },
  warning: { tone: 'assess', label: 'Atenção:', Icon: AlertTriangle, role: 'alert' },
  error: { tone: 'critical', label: 'Importante:', Icon: OctagonAlert, role: 'alert' },
};

/**
 * Banner contextual posicionado no topo de formulários e grades.
 * Fundo suave + barra lateral de 4px na cor semântica + ícone. Texto sempre em #111111.
 */
export const CalloutAlert: React.FC<CalloutAlertProps> = ({
  variant = 'info',
  title,
  children,
  action,
  className,
}) => {
  const { tone, label, Icon, role } = VARIANT_CONFIG[variant];

  return (
    <div
      role={role}
      className={cn(
        'relative flex flex-col gap-4 overflow-hidden rounded-lg border py-4 pl-6 pr-4 sm:flex-row sm:items-start sm:justify-between',
        TONE_SOFT[tone],
        className
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', TONE_FILL[tone])} aria-hidden="true" />
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', TONE_TEXT[tone])} aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-sm font-semibold leading-snug text-ink">
            <span className="sr-only">{label} </span>
            {title}
          </p>
          {children && <div className="text-sm leading-relaxed text-ink">{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0 sm:self-center">{action}</div>}
    </div>
  );
};

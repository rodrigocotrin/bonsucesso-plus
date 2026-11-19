import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../utils/formatters';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  /** Ação principal (sempre ofereça um próximo passo) */
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

/**
 * Estado Vazio acionável: explica o motivo e oferece um próximo passo claro.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center',
        className
      )}
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded border border-line bg-paper text-ink [&>svg]:h-6 [&>svg]:w-6"
        aria-hidden="true"
      >
        {icon ?? <Inbox />}
      </div>
      <h3 className="text-base font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-muted">{description}</p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {secondaryAction}
          {action}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { cn } from '../../utils/formatters';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  as?: 'div' | 'section' | 'article';
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  density?: 'comfortable' | 'compact';
}

/**
 * Card Limpo (Regra 3 & 5):
 * - Superfície branca (#FFFFFF) com borda estrutural suave (#EAE8E1).
 * - Padding respirável p-5.
 * - Sem bordas vermelhas/coloridas externas e sem divisórias pesadas desnecessárias.
 */
export const Card: React.FC<CardProps> = ({
  as: Component = 'div',
  title,
  subtitle,
  eyebrow,
  headerAction,
  footer,
  noPadding = false,
  className,
  children,
  ...props
}) => {
  const hasHeader = Boolean(title || headerAction || eyebrow);

  return (
    <Component
      className={cn(
        'min-w-0 max-w-full overflow-hidden rounded-lg border border-line bg-surface',
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="truncate text-xs font-medium text-ink-muted">{eyebrow}</p>}
            {title && (
              <h2 className="break-words text-base font-semibold tracking-tight text-ink">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 break-words text-xs text-ink-muted">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="min-w-0 max-w-full shrink-0">{headerAction}</div>}
        </div>
      )}

      <div className={cn('min-w-0 max-w-full', !noPadding && 'p-4 sm:p-5')}>{children}</div>

      {footer && (
        <div className="min-w-0 max-w-full border-t border-line px-4 py-3.5 sm:px-5">{footer}</div>
      )}
    </Component>
  );
};

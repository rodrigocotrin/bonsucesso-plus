import React from 'react';
import { cn } from '../../utils/formatters';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article';
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

/**
 * Contêiner Card extensível (OCP) com suporte a cabeçalho estruturado, ações e rodapé.
 */
export const Card: React.FC<CardProps> = ({
  as: Component = 'div',
  title,
  subtitle,
  headerAction,
  footer,
  noPadding = false,
  className,
  children,
  ...props
}) => {
  const hasHeader = Boolean(title || subtitle || headerAction);

  return (
    <Component
      className={cn(
        'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors',
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      <div className={cn(!noPadding && 'p-6')}>{children}</div>

      {footer && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4 rounded-b-2xl dark:border-slate-800 dark:bg-slate-950/40">
          {footer}
        </div>
      )}
    </Component>
  );
};

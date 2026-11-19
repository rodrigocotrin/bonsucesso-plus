import React from 'react';
import { FolderSearch } from 'lucide-react';
import { cn } from '../../utils/formatters';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Estado Vazio (EmptyState) acolhedor quando uma busca, filtro ou lista não retorna dados.
 * Sempre orienta o usuário sobre o motivo e oferece um próximo passo claro.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/50',
        className
      )}
    >
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300"
        aria-hidden="true"
      >
        {icon ?? <FolderSearch className="h-7 w-7" />}
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
        {title}
      </h3>

      <p className="mt-1.5 max-w-md text-base text-slate-600 dark:text-slate-300 leading-relaxed">
        {description}
      </p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

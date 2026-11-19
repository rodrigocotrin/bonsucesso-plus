import React from 'react';
import { Badge, BadgeVariant } from './Badge';
import { cn, evaluateAttendanceStatus } from '../../utils/formatters';

export interface ProgressBarItem {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  max?: number;
  unit?: string;
  thresholdPercentage?: number;
}

export interface ProgressBarGroupProps {
  items: ProgressBarItem[];
  showThresholdMarker?: boolean;
  defaultThreshold?: number;
  className?: string;
}

/**
 * Grupo de barras horizontais rotuladas para assiduidade e metas de estudo.
 * Nunca depende apenas da cor: inclui rótulo de status com ícone (Badge) e marcador visual da meta (ex: 75%).
 */
export const ProgressBarGroup: React.FC<ProgressBarGroupProps> = ({
  items,
  showThresholdMarker = true,
  defaultThreshold = 75,
  className,
}) => {
  return (
    <div className={cn('space-y-5', className)}>
      {items.map((item) => {
        const max = item.max ?? 100;
        const percentage = Math.max(0, Math.min(100, Math.round((item.value / max) * 100)));
        const threshold = item.thresholdPercentage ?? defaultThreshold;
        const attendanceEval = evaluateAttendanceStatus(percentage);

        const barColorClass =
          percentage < threshold
            ? 'bg-danger-700 dark:bg-danger-500'
            : percentage < threshold + 5
            ? 'bg-warning-700 dark:bg-warning-500'
            : 'bg-primary-700 dark:bg-primary-500';

        const badgeVariant: BadgeVariant =
          attendanceEval.status === 'critical'
            ? 'danger'
            : attendanceEval.status === 'attention'
            ? 'warning'
            : 'success';

        const displayValue =
          item.unit === '%' || max === 100
            ? `${percentage}%`
            : `${item.value} de ${max}${item.unit ? ` ${item.unit}` : ''}`;

        return (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {item.label}
                </p>
                {item.sublabel && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {item.sublabel}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {displayValue}
                </span>
                <Badge variant={badgeVariant}>{attendanceEval.label}</Badge>
              </div>
            </div>

            <div className="relative pt-1">
              <div
                role="progressbar"
                aria-label={`${item.label}: ${displayValue}`}
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
              >
                <div
                  className={cn('h-full rounded-full transition-all duration-300', barColorClass)}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {showThresholdMarker && (
                <div
                  className="mt-1.5 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400"
                  aria-hidden="true"
                >
                  <span>0%</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Meta mínima recomendada: {threshold}%
                  </span>
                  <span>100%</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

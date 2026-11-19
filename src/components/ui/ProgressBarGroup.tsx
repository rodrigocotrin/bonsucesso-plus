import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from './Badge';
import { cn } from '../../utils/formatters';
import { TRANSITIONS } from '../../lib/motion';
import { SemanticTone, TONE_FILL } from './tones';

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
  warningBand?: number;
  showStatusBadge?: boolean;
  className?: string;
}

function evaluate(
  percentage: number,
  threshold: number,
  band: number
): { tone: SemanticTone; label: string } {
  if (percentage < threshold) return { tone: 'critical', label: `Abaixo de ${threshold}%` };
  if (percentage < threshold + band) return { tone: 'assess', label: 'Próximo do limite' };
  return { tone: 'progress', label: 'Em dia' };
}

/**
 * Barras de progresso com preenchimento GPU-only via `scaleX` e `transform-origin: left`
 * (duration: 0.35s, cubic-bezier(0.22, 1, 0.36, 1)). Nunca anima `width`.
 */
export const ProgressBarGroup: React.FC<ProgressBarGroupProps> = ({
  items,
  showThresholdMarker = true,
  defaultThreshold = 75,
  warningBand = 5,
  showStatusBadge = true,
  className,
}) => {
  return (
    <ul className={cn('divide-y divide-line', className)}>
      {items.map((item) => {
        const max = item.max ?? 100;
        const percentage = Math.max(0, Math.min(100, Math.round((item.value / max) * 100)));
        const threshold = item.thresholdPercentage ?? defaultThreshold;
        const status = evaluate(percentage, threshold, warningBand);

        const displayValue =
          item.unit === '%' || max === 100
            ? `${percentage}%`
            : `${item.value}/${max}${item.unit ? ` ${item.unit}` : ''}`;

        return (
          <li key={item.id} className="py-4 first:pt-0 last:pb-0">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{item.label}</p>
                {item.sublabel && <p className="text-xs text-ink-muted">{item.sublabel}</p>}
              </div>
              <div className="flex items-center gap-2">
                {showStatusBadge && <Badge variant={status.tone}>{status.label}</Badge>}
                <span className="num w-14 text-right text-sm font-semibold text-ink">
                  {displayValue}
                </span>
              </div>
            </div>

            <div
              role="progressbar"
              aria-label={`${item.label}: ${displayValue} — ${status.label}`}
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              className="relative h-2 w-full rounded-sm bg-subtle"
            >
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: percentage / 100 }}
                transition={TRANSITIONS.progressBar}
                style={{ transformOrigin: 'left' }}
                className={cn('h-full w-full rounded-sm', TONE_FILL[status.tone])}
              />
              {showThresholdMarker && (
                <span
                  className="absolute -top-1 h-4 w-px bg-ink"
                  style={{ left: `${threshold}%` }}
                  aria-hidden="true"
                  title={`Meta: ${threshold}%`}
                />
              )}
            </div>
          </li>
        );
      })}
      {showThresholdMarker && items.length > 0 && (
        <li className="flex items-center gap-2 pt-4 text-xs text-ink-muted" aria-hidden="true">
          <span className="h-3 w-px bg-ink" />
          <span>
            Meta mínima de presença: <span className="num">{defaultThreshold}%</span>
          </span>
        </li>
      )}
    </ul>
  );
};

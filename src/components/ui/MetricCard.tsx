import React from 'react';
import { motion } from 'framer-motion';
import { BadgeVariant } from './Badge';
import { cn } from '../../utils/formatters';
import { DURATIONS, EASINGS } from '../../lib/motion';
import { resolveTone, TONE_DOT, TONE_TEXT, ToneInput } from './tones';

export type MetricScale = 'enem' | 'percentage' | 'raw';
export type TrendDirection = 'up' | 'down' | 'neutral';

export interface MetricCardProps {
  title: string;
  value: number | string;
  scale?: MetricScale;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    direction: TrendDirection;
    label: string;
    variant?: BadgeVariant;
  };
  statusBadge?: {
    label: string;
    variant: BadgeVariant;
  };
  accentColor?: ToneInput;
  /** Índice opcional para stagger (máx. 30ms entre cards) */
  staggerIndex?: number;
  className?: string;
}

// Contador cíclico leve para garantir stagger sutil de até 30ms entre cards irmãos na montagem
let autoStaggerCounter = 0;

function splitNumericAndUnit(
  value: number | string,
  scale: MetricScale
): { numericPart: string; unitPart: string } {
  if (typeof value === 'number') {
    if (scale === 'enem') {
      return { numericPart: String(Math.round(value)), unitPart: '/ 1000' };
    }
    if (scale === 'percentage') {
      return { numericPart: `${Math.round(value)}%`, unitPart: '' };
    }
    return { numericPart: String(value), unitPart: '' };
  }

  const trimmed = value.trim();
  const match = trimmed.match(/^([+-]?\d+(?:[.,]\d+)?%?)\s*(.*)$/);
  if (match) {
    return {
      numericPart: match[1],
      unitPart: match[2] || '',
    };
  }

  return { numericPart: trimmed, unitPart: '' };
}

/**
 * KPI Card Ultra-Limpo com entrada em cascata sutil (stagger <= 30ms, y: 8 -> 0, opacity: 0 -> 1).
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  scale = 'raw',
  subtitle,
  trend,
  statusBadge,
  accentColor = 'neutral',
  staggerIndex,
  className,
}) => {
  const slotIndex = React.useMemo(() => {
    if (typeof staggerIndex === 'number') return staggerIndex;
    const current = autoStaggerCounter % 4;
    autoStaggerCounter = (autoStaggerCounter + 1) % 4;
    return current;
  }, [staggerIndex]);

  const { numericPart, unitPart } = React.useMemo(
    () => splitNumericAndUnit(value, scale),
    [value, scale]
  );

  const contextLine = trend?.label ?? statusBadge?.label ?? subtitle;
  const contextTone = trend
    ? resolveTone(
        trend.variant ??
          (trend.direction === 'up'
            ? 'progress'
            : trend.direction === 'down'
            ? 'critical'
            : 'neutral')
      )
    : statusBadge
    ? resolveTone(statusBadge.variant)
    : resolveTone(accentColor);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: DURATIONS.pageEnter,
        ease: EASINGS.snappy,
        delay: Math.min(slotIndex, 4) * 0.03,
      }}
      className={cn(
        'flex h-full min-w-0 max-w-full flex-col justify-between overflow-hidden rounded-lg border border-line bg-surface p-4 sm:p-5',
        className
      )}
    >
      <p className="truncate text-xs font-medium text-ink-muted">{title}</p>

      <div className="my-2 flex min-w-0 flex-wrap items-baseline gap-1.5">
        <span className="font-mono text-2xl sm:text-3xl font-semibold tracking-tight text-ink tabular-nums break-words">
          {numericPart}
        </span>
        {unitPart && (
          <span className="font-sans text-xs sm:text-sm font-normal text-ink-muted">
            {unitPart}
          </span>
        )}
      </div>

      {contextLine && (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONE_DOT[contextTone])}
            aria-hidden="true"
          />
          <span
            className={cn(
              'truncate font-medium',
              trend || statusBadge ? TONE_TEXT[contextTone] : 'text-ink-muted'
            )}
          >
            {contextLine}
          </span>
        </div>
      )}
    </motion.div>
  );
};

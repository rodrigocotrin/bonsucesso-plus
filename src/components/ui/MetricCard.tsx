import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card } from './Card';
import { Badge, BadgeVariant } from './Badge';
import { cn, formatEnemScore, formatPercentage } from '../../utils/formatters';

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
  accentColor?: 'primary' | 'secondary' | 'warning' | 'danger' | 'success';
  className?: string;
}

const ACCENT_BORDER: Record<NonNullable<MetricCardProps['accentColor']>, string> = {
  primary: 'border-l-4 border-l-primary-700 dark:border-l-primary-500',
  secondary: 'border-l-4 border-l-secondary-700 dark:border-l-secondary-500',
  success: 'border-l-4 border-l-success-700 dark:border-l-success-500',
  warning: 'border-l-4 border-l-warning-700 dark:border-l-warning-500',
  danger: 'border-l-4 border-l-danger-700 dark:border-l-danger-500',
};

const TREND_ICONS: Record<TrendDirection, React.ReactNode> = {
  up: <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />,
  down: <ArrowDownRight className="h-4 w-4 shrink-0" aria-hidden="true" />,
  neutral: <Minus className="h-4 w-4 shrink-0" aria-hidden="true" />,
};

/**
 * Cartão de Métrica Pedagógica com suporte nativo à escala ENEM (0 a 1000 pts),
 * porcentagem de presença (%) ou valores absolutos, acompanhado de badge explicativo.
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  scale = 'raw',
  subtitle,
  icon,
  trend,
  statusBadge,
  accentColor = 'primary',
  className,
}) => {
  const formattedValue = React.useMemo(() => {
    if (typeof value === 'string') return value;
    if (scale === 'enem') return formatEnemScore(value);
    if (scale === 'percentage') return formatPercentage(value);
    return String(value);
  }, [value, scale]);

  const scaleDescription =
    scale === 'enem'
      ? 'Escala ENEM (0 a 1000 pontos)'
      : scale === 'percentage'
      ? 'Taxa percentual (0% a 100%)'
      : null;

  return (
    <Card className={cn('overflow-hidden h-full', ACCENT_BORDER[accentColor], className)}>
      <div className="flex h-full flex-col gap-3">
        {/* Linha 1: Ícone à esquerda + Badge de status à direita (nunca espremendo o título) */}
        {(icon || statusBadge) && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            {icon && (
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                aria-hidden="true"
              >
                {icon}
              </div>
            )}

            {statusBadge && (
              <Badge variant={statusBadge.variant} className="max-w-full">
                {statusBadge.label}
              </Badge>
            )}
          </div>
        )}

        {/* Linha 2: Título com 100% da largura do card (sem quebra letra por letra) */}
        <div>
          <p className="text-base font-bold leading-snug text-slate-700 dark:text-slate-200">
            {title}
          </p>
          {scaleDescription && (
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {scaleDescription}
            </span>
          )}
        </div>

        {/* Linha 3: Valor Principal + Badge de variação (se houver) */}
        <div className="flex flex-col items-start gap-2 pt-0.5">
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            {formattedValue}
          </p>

          {trend && (
            <Badge
              variant={
                trend.variant ??
                (trend.direction === 'up'
                  ? 'success'
                  : trend.direction === 'down'
                  ? 'warning'
                  : 'neutral')
              }
              icon={TREND_ICONS[trend.direction]}
              className="max-w-full"
            >
              {trend.label}
            </Badge>
          )}
        </div>

        {subtitle && (
          <p className="mt-auto text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2.5">
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
};

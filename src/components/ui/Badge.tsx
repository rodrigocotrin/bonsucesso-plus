import React from 'react';
import { cn } from '../../utils/formatters';
import { resolveTone, SemanticTone, TONE_DOT, ToneInput } from './tones';

export type BadgeVariant = ToneInput;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  showDefaultIcon?: boolean;
}

const SOFT_PILL_BG: Record<SemanticTone, string> = {
  neutral: 'bg-subtle text-ink-muted',
  ink: 'bg-subtle text-ink',
  academic: 'bg-academic-bg text-academic',
  progress: 'bg-progress-bg text-progress',
  assess: 'bg-assess-bg text-assess-ink',
  critical: 'bg-critical-bg text-critical',
};

/**
 * Badge sem borda interna (Fim do Box-ception — Regra 3):
 * Ponto de 6px na cor semântica + pill suave sem borda.
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  icon: _icon,
  showDefaultIcon: _showDefaultIcon,
  className,
  children,
  ...props
}) => {
  const tone = resolveTone(variant);

  return (
    <span
      className={cn(
        'inline-flex h-6 max-w-full items-center gap-1.5 rounded-md px-2 text-xs font-medium',
        SOFT_PILL_BG[tone],
        className
      )}
      {...props}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONE_DOT[tone])} aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  );
};

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EASINGS } from '../../lib/motion';
import { cn } from '../../utils/formatters';

export type BrandLoaderVariant = 'fullscreen' | 'inline';
export type BrandLoaderSize = 'sm' | 'md' | 'lg';

export interface BrandLoaderProps {
  /**
   * - `fullscreen`: centralizado sobre o fundo base (`bg-paper`) para boot inicial, Suspense de rotas ou troca de sessão.
   * - `inline`: compacto para uso dentro de cards, gráficos, modais ou drawers.
   */
  variant?: BrandLoaderVariant;
  /** Texto discreto opcional abaixo do ícone (`text-xs text-ink-muted`) */
  label?: string;
  size?: BrandLoaderSize;
  className?: string;
}

/**
 * Os 4 quadrados da grade 2x2 da logo Bonsucesso+.
 * Ordem visual no CSS Grid 2x2:
 * - [0,0] Superior Esquerdo: Azul (#1D4ED8)   -> passo 0 (0.00s)
 * - [0,1] Superior Direito:  Amarelo (#EAB308)-> passo 1 (0.15s)
 * - [1,0] Inferior Esquerdo: Verde (#15803D)  -> passo 3 (0.45s)
 * - [1,1] Inferior Direito:  Vermelho (#DC2626)-> passo 2 (0.30s)
 *
 * Sentido horário: Azul (0s) → Amarelo (0.15s) → Vermelho (0.30s) → Verde (0.45s).
 */
const BAUHAUS_SQUARES = [
  { id: 'blue', colorClass: 'bg-[#1D4ED8]', delay: 0 },
  { id: 'yellow', colorClass: 'bg-[#EAB308]', delay: 0.15 },
  { id: 'green', colorClass: 'bg-[#15803D]', delay: 0.45 },
  { id: 'red', colorClass: 'bg-[#DC2626]', delay: 0.3 },
] as const;

const SIZE_MAP: Record<
  BrandLoaderSize,
  { frame: string; gridGap: string; square: string }
> = {
  sm: {
    frame: 'h-8 w-8 rounded-md',
    gridGap: 'gap-[2px]',
    square: 'h-[6px] w-[6px] rounded-[1px]',
  },
  md: {
    frame: 'h-11 w-11 rounded-lg',
    gridGap: 'gap-[3px]',
    square: 'h-2 w-2 rounded-[1.5px]',
  },
  lg: {
    frame: 'h-14 w-14 rounded-lg',
    gridGap: 'gap-1',
    square: 'h-2.5 w-2.5 rounded-[2px]',
  },
};

/**
 * BrandLoader — Indicador de carregamento geométrico Bauhaus Suíço (GPU-only).
 */
export const BrandLoader: React.FC<BrandLoaderProps> = ({
  variant = 'inline',
  label,
  size,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const resolvedSize: BrandLoaderSize =
    size ?? (variant === 'fullscreen' ? 'lg' : 'md');
  const dimensions = SIZE_MAP[resolvedSize];
  const displayLabel =
    label !== undefined
      ? label
      : variant === 'fullscreen'
      ? 'Carregando dados...'
      : undefined;

  const iconBox = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={cn(
          'flex shrink-0 items-center justify-center border border-line bg-surface shadow-xs',
          dimensions.frame
        )}
        aria-hidden="true"
      >
        <div className={cn('grid grid-cols-2', dimensions.gridGap)}>
          {BAUHAUS_SQUARES.map((sq) => (
            <motion.span
              key={sq.id}
              className={cn('block will-change-transform', sq.colorClass, dimensions.square)}
              animate={
                prefersReducedMotion
                  ? { opacity: [0.35, 1, 0.35] }
                  : { opacity: [0.25, 1, 0.25], scale: [0.88, 1, 0.88] }
              }
              transition={{
                duration: 1.1,
                delay: sq.delay,
                repeat: Infinity,
                ease: EASINGS.snappy,
              }}
            />
          ))}
        </div>
      </div>

      {displayLabel ? (
        <span className="text-xs font-medium text-ink-muted">{displayLabel}</span>
      ) : (
        <span className="sr-only">Carregando...</span>
      )}
    </div>
  );

  if (variant === 'fullscreen') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={cn(
          'flex min-h-[60vh] w-full flex-col items-center justify-center bg-paper p-6 text-ink',
          className
        )}
      >
        {iconBox}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn('inline-flex items-center justify-center p-2', className)}
    >
      {iconBox}
    </div>
  );
};

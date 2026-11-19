import React from 'react';
import { cn } from '../../utils/formatters';

export interface BrandLockupProps {
  /** Oculta o nome textual quando a sidebar está recolhida */
  collapsed?: boolean;
  /** Subtítulo opcional abaixo da marca */
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Lockup Oficial da Marca `Bonsucesso+` (Seção 1 do Contrato):
 * - Grade geométrica minimalista 2x2: 4 quadrados de 6px com gap-[2px]
 *   nas cores Azul (#1D4ED8), Amarelo (#EAB308), Verde (#15803D) e Vermelho (#DC2626).
 * - Seguida de `Bonsucesso` em Plus Jakarta Sans ExtraBold (#111111) e `+` em Bold.
 */
export const BrandLockup: React.FC<BrandLockupProps> = ({
  collapsed = false,
  subtitle,
  size = 'md',
  className,
}) => {
  const textSize =
    size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <div className={cn('inline-flex min-w-0 max-w-full items-center gap-3 select-none', className)}>
      {/* Símbolo Bauhaus 2x2 (4 quadrados de 6px com gap de 2px = 14x14px dentro de moldura técnica) */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-line bg-surface"
        aria-hidden="true"
      >
        <div className="grid grid-cols-2 gap-[2px]">
          <span className="block h-[6px] w-[6px] bg-[#1D4ED8]" />
          <span className="block h-[6px] w-[6px] bg-[#EAB308]" />
          <span className="block h-[6px] w-[6px] bg-[#15803D]" />
          <span className="block h-[6px] w-[6px] bg-[#DC2626]" />
        </div>
      </div>

      {!collapsed && (
        <div className="min-w-0 leading-none">
          <div className={cn('tracking-tight text-ink', textSize)}>
            <span className="font-extrabold">Bonsucesso</span>
            <span className="font-bold">+</span>
          </div>
          {subtitle && (
            <p className="mt-1 truncate text-xs font-medium text-ink-muted">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

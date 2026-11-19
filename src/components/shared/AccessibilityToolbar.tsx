import React from 'react';
import { motion } from 'framer-motion';
import { Type } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { SPRINGS } from '../../lib/motion';
import { FontScale } from '../../types';
import { cn } from '../../utils/formatters';

const FONT_SCALE_OPTIONS: Array<{ value: FontScale; label: string; shortLabel: string }> = [
  { value: 'normal', label: 'Padrão (100%)', shortLabel: '100%' },
  { value: 'large', label: 'Ampliado (112%)', shortLabel: '112%' },
  { value: 'xlarge', label: 'Extra Grande (125%)', shortLabel: '125%' },
];

/**
 * Controle tipográfico de escala (Normal / Grande / Extra Grande) em estética Bauhaus Suíço
 * com indicador deslizante (`layoutId`).
 */
export const AccessibilityToolbar: React.FC = () => {
  const { fontScale, setFontScale } = useAccessibility();

  return (
    <div
      role="group"
      aria-label="Escala tipográfica da interface"
      className="inline-flex flex-wrap items-center gap-1 rounded-md bg-track p-1"
    >
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-ink-muted">
        <Type className="h-3.5 w-3.5 text-ink" aria-hidden="true" />
        <span>Escala:</span>
      </span>

      {FONT_SCALE_OPTIONS.map((opt) => {
        const isActive = fontScale === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFontScale(opt.value)}
            aria-pressed={isActive}
            title={opt.label}
            className={cn(
              'relative h-9 rounded px-3 text-xs transition-colors duration-150 active:scale-[0.98]',
              isActive
                ? 'font-semibold text-ink'
                : 'font-medium text-ink-muted hover:text-ink'
            )}
          >
            {isActive && (
              <motion.span
                layoutId="accessibility-font-scale-pill"
                transition={SPRINGS.indicator}
                className="absolute inset-0 rounded bg-surface shadow-xs"
                aria-hidden="true"
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

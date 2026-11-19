import React from 'react';
import { Moon, Sun, Type } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { FontScale } from '../../types';
import { cn } from '../../utils/formatters';

const FONT_SCALE_OPTIONS: Array<{ value: FontScale; label: string; shortLabel: string }> = [
  { value: 'normal', label: 'Letra Normal (16px)', shortLabel: 'Normal' },
  { value: 'large', label: 'Letra Grande (18px)', shortLabel: 'Grande' },
  { value: 'xlarge', label: 'Letra Extra Grande (20px)', shortLabel: 'Extra Grande' },
];

/**
 * Barra de Acessibilidade reutilizável para alternância imediata de Tema (Claro / Escuro)
 * e Tamanho da Fonte (Normal / Grande / Extra Grande).
 * Segue a diretriz de ícones SEMPRE acompanhados de rótulos claros e área mínima de 44x44px.
 */
export const AccessibilityToolbar: React.FC = () => {
  const { theme, toggleTheme, fontScale, setFontScale } = useAccessibility();

  return (
    <div
      role="region"
      aria-label="Controles de Acessibilidade: Tema e Tamanho da Letra"
      className="flex flex-wrap items-center gap-2 sm:gap-3"
    >
      {/* Seletor de Tamanho da Fonte */}
      <div
        role="group"
        aria-label="Escolher tamanho da letra"
        className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-300 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800"
      >
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Type className="h-4 w-4 text-primary-700 dark:text-primary-400" aria-hidden="true" />
          <span>Tamanho da Letra:</span>
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
                'min-h-[38px] rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-primary-700 text-white shadow-xs dark:bg-primary-600'
                  : 'text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {opt.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Alternador de Tema Claro / Escuro */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-pressed={theme === 'dark'}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        {theme === 'light' ? (
          <>
            <Moon className="h-4 w-4 text-secondary-700" aria-hidden="true" />
            <span>Modo Escuro</span>
          </>
        ) : (
          <>
            <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <span>Modo Claro</span>
          </>
        )}
      </button>
    </div>
  );
};

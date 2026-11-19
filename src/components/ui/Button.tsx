import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/formatters';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900 dark:bg-primary-600 dark:hover:bg-primary-500 shadow-sm border border-transparent',
  secondary:
    'bg-secondary-700 text-white hover:bg-secondary-800 active:bg-secondary-900 dark:bg-secondary-600 dark:hover:bg-secondary-500 shadow-sm border border-transparent',
  ghost:
    'bg-white text-slate-800 border-2 border-slate-300 hover:bg-slate-100 hover:border-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800',
  danger:
    'bg-danger-700 text-white hover:bg-danger-800 active:bg-danger-900 dark:bg-danger-600 dark:hover:bg-danger-500 shadow-sm border border-transparent',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  md: 'min-h-[44px] min-w-[44px] px-4 py-2.5 text-base',
  lg: 'min-h-[52px] min-w-[52px] px-6 py-3 text-lg',
};

/**
 * Componente Button do Design System IntegraCurso.
 * Garante área mínima de toque de 44x44px (WCAG 2.1), alto contraste e estado de carregamento acessível.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText = 'Processando...',
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center gap-2.5 rounded-xl font-semibold transition-all duration-150 select-none',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden="true" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="shrink-0 flex items-center" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            <span>{children}</span>
            {rightIcon && (
              <span className="shrink-0 flex items-center" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

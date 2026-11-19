import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/formatters';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'academic';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

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
    'bg-cta text-cta-fg border border-cta hover:bg-cta-hover hover:border-cta-hover',
  secondary:
    'bg-surface text-ink border border-line hover:bg-subtle hover:border-ink/40',
  ghost:
    'bg-transparent text-ink-muted border border-transparent hover:bg-subtle hover:text-ink',
  danger:
    'bg-critical-bg text-critical border border-transparent hover:bg-critical hover:text-white',
  academic:
    'bg-academic-bg text-academic border border-transparent hover:bg-academic hover:text-white',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs gap-1.5',
  md: 'h-11 sm:h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  icon: 'h-10 w-10 p-0',
};

/**
 * Botão com feedback tátil instantâneo (150ms ease-out + active:scale-[0.98]).
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
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
        aria-busy={isLoading || undefined}
        className={cn(
          'inline-flex shrink-0 select-none items-center justify-center rounded-md font-medium',
          'transition-all duration-150 ease-out active:scale-[0.98]',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            <span>{loadingText ?? children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="flex shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children !== undefined && children !== null && children !== false && (
              <span className={cn('leading-none', size === 'icon' && 'sr-only')}>{children}</span>
            )}
            {rightIcon && (
              <span className="flex shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
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

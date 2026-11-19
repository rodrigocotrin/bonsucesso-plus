import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/formatters';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  optionalText?: string;
  /** Ativa JetBrains Mono + tabular-nums para campos de CPF, nota, data, horário ou telefone */
  mono?: boolean;
}

/**
 * Campo de entrada com label visível, altura mínima h-11 (mobile) / h-10 (desktop),
 * borda estrutural 1px #E4E4E7, foco 1px #111111 e validação inline em Vermelho (#DC2626).
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorText,
      leftIcon,
      rightElement,
      optionalText,
      mono = false,
      id,
      required,
      disabled,
      className,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    const hasError = Boolean(errorText);
    const isNumericType =
      mono || type === 'number' || type === 'date' || type === 'time' || type === 'tel';

    const describedBy =
      [helperText ? helperId : null, hasError ? errorId : null].filter(Boolean).join(' ') ||
      undefined;

    return (
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-ink">
            {label}
            {required && (
              <span className="ml-1 font-bold text-critical" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {optionalText && !required && (
            <span className="text-xs text-ink-muted">({optionalText})</span>
          )}
        </div>

        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="pointer-events-none absolute left-3 flex items-center text-ink-muted [&>svg]:h-4 [&>svg]:w-4"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            required={required}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            className={cn(
              'h-11 sm:h-10 w-full rounded border bg-surface px-3 text-sm text-ink transition-colors duration-150 placeholder:text-ink-muted/70',
              'disabled:cursor-not-allowed disabled:bg-subtle disabled:text-ink-muted',
              isNumericType && 'num',
              Boolean(leftIcon) && 'pl-9',
              Boolean(rightElement) && 'pr-24',
              hasError
                ? 'border-critical bg-critical-bg/30 focus-visible:border-critical focus-visible:ring-critical'
                : 'border-line hover:border-ink/60 focus-visible:border-ink',
              className
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-1.5 flex items-center">{rightElement}</div>
          )}
        </div>

        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="flex items-start gap-1 text-xs font-medium text-critical"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{errorText}</span>
          </p>
        )}

        {helperText && !hasError && (
          <p id={helperId} className="text-xs text-ink-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

import React, { useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/formatters';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  placeholderOption?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
}

/**
 * Select padronizado (h-11 mobile / h-10 desktop), borda 1px #E4E4E7 e validação inline em Vermelho (#DC2626).
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      placeholderOption,
      helperText,
      errorText,
      leftIcon,
      id,
      required,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || `select-${generatedId}`;
    const helperId = `${selectId}-helper`;
    const errorId = `${selectId}-error`;
    const hasError = Boolean(errorText);

    const describedBy =
      [helperText ? helperId : null, hasError ? errorId : null].filter(Boolean).join(' ') ||
      undefined;

    return (
      <div className="flex w-full flex-col gap-1">
        <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wider text-ink">
          {label}
          {required && (
            <span className="ml-1 font-bold text-critical" aria-hidden="true">
              *
            </span>
          )}
        </label>

        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="pointer-events-none absolute left-3 flex items-center text-ink-muted [&>svg]:h-4 [&>svg]:w-4"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <select
            ref={ref}
            id={selectId}
            required={required}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            className={cn(
              'h-11 sm:h-10 w-full appearance-none rounded border bg-surface px-3 pr-9 text-sm text-ink transition-colors duration-150',
              'disabled:cursor-not-allowed disabled:bg-subtle disabled:text-ink-muted',
              Boolean(leftIcon) && 'pl-9',
              hasError
                ? 'border-critical bg-critical-bg/30 focus-visible:border-critical focus-visible:ring-critical'
                : 'border-line hover:border-ink/60 focus-visible:border-ink',
              className
            )}
            {...props}
          >
            {placeholderOption && (
              <option value="" disabled>
                {placeholderOption}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown
            className="pointer-events-none absolute right-3 h-4 w-4 text-ink-muted"
            aria-hidden="true"
          />
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

Select.displayName = 'Select';

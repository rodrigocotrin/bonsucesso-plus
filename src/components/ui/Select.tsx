import React, { useId } from 'react';
import { AlertCircle, ChevronDown, HelpCircle } from 'lucide-react';
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
 * Campo de seleção com rótulo sempre visível acima, ícone claro e suporte a mensagens de ajuda e erro.
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

    const describedBy = [
      helperText ? helperId : null,
      hasError ? errorId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="w-full flex flex-col gap-1.5">
        <label
          htmlFor={selectId}
          className="text-base font-semibold text-slate-900 dark:text-slate-100"
        >
          {label}
          {required && (
            <span className="ml-1 text-danger-700 dark:text-danger-400 font-bold" aria-hidden="true">
              *
            </span>
          )}
        </label>

        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="absolute left-3.5 text-slate-500 dark:text-slate-400 pointer-events-none flex items-center"
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
              'w-full min-h-[44px] appearance-none rounded-xl border-2 px-3.5 py-2.5 pr-10 text-base transition-colors',
              'bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100',
              'disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-400 disabled:cursor-not-allowed',
              leftIcon ? 'pl-11' : '',
              hasError
                ? 'border-danger-700 dark:border-danger-500 focus-visible:ring-danger-700'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:border-primary-700 dark:focus-visible:border-primary-400',
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
            className="absolute right-3.5 h-5 w-5 text-slate-600 dark:text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="flex items-start gap-1.5 text-sm font-medium text-danger-700 dark:text-danger-400 mt-0.5"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorText}</span>
          </p>
        )}

        {helperText && (
          <p
            id={helperId}
            className="flex items-start gap-1.5 text-sm text-slate-600 dark:text-slate-300 mt-0.5"
          >
            <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            <span>{helperText}</span>
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

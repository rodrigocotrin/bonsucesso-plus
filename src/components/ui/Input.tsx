import React, { useId } from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '../../utils/formatters';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  optionalText?: string;
}

/**
 * Campo de entrada de texto com rótulo (label) sempre visível acima do campo.
 * Nunca depende apenas de placeholder para orientar o usuário.
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
      id,
      required,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    const hasError = Boolean(errorText);

    const describedBy = [
      helperText ? helperId : null,
      hasError ? errorId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <label
            htmlFor={inputId}
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            {label}
            {required && (
              <span className="ml-1 text-danger-700 dark:text-danger-400 font-bold" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {optionalText && !required && (
            <span className="text-sm text-slate-600 dark:text-slate-400">
              ({optionalText})
            </span>
          )}
        </div>

        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="absolute left-3.5 text-slate-500 dark:text-slate-400 pointer-events-none flex items-center"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            className={cn(
              'w-full min-h-[44px] rounded-xl border-2 px-3.5 py-2.5 text-base transition-colors',
              'bg-white text-slate-900 placeholder:text-slate-400',
              'dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500',
              'disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-400 disabled:cursor-not-allowed',
              leftIcon ? 'pl-11' : '',
              rightElement ? 'pr-12' : '',
              hasError
                ? 'border-danger-700 dark:border-danger-500 focus-visible:ring-danger-700'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:border-primary-700 dark:focus-visible:border-primary-400',
              className
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-2 flex items-center">
              {rightElement}
            </div>
          )}
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

Input.displayName = 'Input';

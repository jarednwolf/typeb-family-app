'use client';

import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  errorText?: string;
  className?: string;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function Input({ label, helperText, errorText, className, id, ...rest }: InputProps) {
  const inputId = id || React.useId();
  const describedBy = errorText ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined;

  return (
    <div className={cx('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm text-gray-600 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={!!errorText || undefined}
        className={cx(
          'w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none',
          'border-gray-200',
          'focus:ring-[var(--color-info)]',
          'bg-white',
        )}
        style={{ background: 'var(--color-input-background)' }}
        {...rest}
      />
      {helperText && !errorText && (
        <p id={`${inputId}-help`} className="mt-1 text-xs text-gray-500">
          {helperText}
        </p>
      )}
      {errorText && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600">
          {errorText}
        </p>
      )}
    </div>
  );
}

export default Input;



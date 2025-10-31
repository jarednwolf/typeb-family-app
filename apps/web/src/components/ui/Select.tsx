'use client';

import React, { forwardRef } from 'react';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  helperText?: string;
  errorText?: string;
  className?: string;
  children?: React.ReactNode;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, helperText, errorText, className, id, children, ...rest },
  ref
) {
  const selectId = id || React.useId();
  const describedBy = errorText ? `${selectId}-error` : helperText ? `${selectId}-help` : undefined;

  return (
    <div className={cx('w-full', className)}>
      {label && (
        <label htmlFor={selectId} className="block text-sm text-gray-600 mb-1">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
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
      >
        {children}
      </select>
      {helperText && !errorText && (
        <p id={`${selectId}-help`} className="mt-1 text-xs text-gray-500">
          {helperText}
        </p>
      )}
      {errorText && (
        <p id={`${selectId}-error`} className="mt-1 text-xs text-red-600">
          {errorText}
        </p>
      )}
    </div>
  );
});

export default Select;



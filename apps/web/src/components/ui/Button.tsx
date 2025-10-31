'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function variantClasses(variant: ButtonVariant) {
  switch (variant) {
    case 'primary':
      return 'btn btn-primary';
    case 'secondary':
      return 'btn btn-secondary';
    case 'danger':
      return 'btn btn-danger';
    case 'link':
      return 'btn btn-link';
  }
}

function sizeClasses(size: ButtonSize) {
  switch (size) {
    case 'sm':
      return 'btn-sm';
    case 'md':
      return '';
    case 'lg':
      return 'text-base px-5';
  }
}

function Button({ variant = 'primary', size = 'md', fullWidth, loading, asChild, className, children, disabled, ...rest }: ButtonProps) {
  const base = cx(
    'btn btn-hover-lift',
    variantClasses(variant),
    sizeClasses(size),
    fullWidth && 'w-full',
    (disabled || loading) && 'opacity-60 pointer-events-none',
    className
  );

  if (asChild && React.isValidElement(children)) {
    // Clone the child (e.g., Next.js Link) and inject button classes
    return React.cloneElement(children as React.ReactElement, {
      className: cx((children as any).props?.className, base),
      'aria-busy': loading ? true : undefined,
    });
  }

  return (
    <button className={base} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {children}
    </button>
  );
}

export default Button;



'use client';

import React from 'react';

type BadgeVariant = 'neutral' | 'success' | 'info' | 'warning' | 'error';

type Props = {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const tokenColor: Record<Exclude<BadgeVariant, 'neutral'>, string> = {
  success: 'var(--color-success)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
};

export default function Badge({ variant = 'neutral', children, className }: Props) {
  const style =
    variant === 'neutral'
      ? { borderColor: 'var(--color-separator)' }
      : { borderColor: tokenColor[variant], color: tokenColor[variant] };

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        'bg-white',
        className
      )}
      style={style as React.CSSProperties}
    >
      {children}
    </span>
  );
}



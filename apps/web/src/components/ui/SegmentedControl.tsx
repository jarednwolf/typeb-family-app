'use client';

import React from 'react';

type Option = { label: string; value: string };

type Props = {
  value: string;
  options: Option[];
  onChange: (val: string) => void;
  className?: string;
  'aria-label'?: string;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function SegmentedControl({ value, options, onChange, className, 'aria-label': ariaLabel }: Props) {
  const groupRef = React.useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = options.findIndex(o => o.value === value);
    if (idx < 0) return;
    if (e.key === 'ArrowRight') {
      const next = options[(idx + 1) % options.length];
      onChange(next.value);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      const prev = options[(idx - 1 + options.length) % options.length];
      onChange(prev.value);
      e.preventDefault();
    }
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={cx('inline-flex border rounded-lg overflow-hidden text-sm', className)}
      onKeyDown={onKeyDown}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            className={cx(
              'px-3 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-info)]',
              active ? 'bg-black text-white' : 'bg-white text-gray-900'
            )}
            onClick={() => onChange(opt.value)}
            type="button"
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}



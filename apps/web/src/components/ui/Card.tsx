'use client';

import React from 'react';

type CardProps = {
  size?: 'default' | 'lg' | 'xl';
  className?: string;
  children?: React.ReactNode;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function Card({ size = 'default', className, children }: CardProps) {
  const base =
    size === 'xl' ? 'card-xl' : size === 'lg' ? 'card-lg' : 'card';
  return <div className={cx(base, className)}>{children}</div>;
}



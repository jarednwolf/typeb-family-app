import * as React from 'react';

export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number | string };

function Svg(props: IconProps & { children: React.ReactNode }) {
  const { size = 24, children, ...rest } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...rest}>
      {children}
    </svg>
  );
}

export const IconHome = (props: IconProps) => (
  <Svg {...props}><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9v7a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4H9v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-7z"/></Svg>
);
export const IconUsers = (props: IconProps) => (
  <Svg {...props}><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-4M9 20v-2a4 4 0 015-4m-7 6H2v-2a4 4 0 015-4m5-6a3 3 0 11-6 0 3 3 0 016 0m8 3a3 3 0 11-6 0 3 3 0 016 0"/></Svg>
);
export const IconChart = (props: IconProps) => (
  <Svg {...props}><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 19v-6m6 6V7m6 14V4"/></Svg>
);
export const IconCheck = (props: IconProps) => (
  <Svg {...props}><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></Svg>
);
export const IconCog = (props: IconProps) => (
  <Svg {...props}><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l.7 2.154a1 1 0 00.95.69h2.262a1 1 0 01.592 1.806l-1.833 1.333a1 1 0 00-.364 1.118l.7 2.154c.3.921-.755 1.688-1.54 1.118l-1.833-1.333a1 1 0 00-1.175 0l-1.833 1.333c-.784.57-1.838-.197-1.539-1.118l.7-2.154a1 1 0 00-.364-1.118L6.432 7.577A1 1 0 016.132 5.77h2.262a1 1 0 00.95-.69l.7-2.154z"/></Svg>
);
export const IconTask = (props: IconProps) => (
  <Svg {...props}><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></Svg>
);

export type NamedIcon = 'home' | 'users' | 'check' | 'chart' | 'cog' | 'task';
export function Icon({ name, size = 20, ...rest }: IconProps & { name: NamedIcon }) {
  switch (name) {
    case 'home': return <IconHome size={size} {...rest} />;
    case 'users': return <IconUsers size={size} {...rest} />;
    case 'check': return <IconCheck size={size} {...rest} />;
    case 'chart': return <IconChart size={size} {...rest} />;
    case 'cog': return <IconCog size={size} {...rest} />;
    case 'task': return <IconTask size={size} {...rest} />;
    default: return null as any;
  }
}



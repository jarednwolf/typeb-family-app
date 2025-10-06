'use client';

type Props = { name: string; src?: string; size?: number };

export default function Avatar({ name, src, size = 32 }: Props) {
  const initials = (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  if (src) {
    return <img src={src} alt={name} width={size} height={size} className="rounded-full object-cover" />;
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gray-200 flex items-center justify-center text-gray-700"
      aria-label={name}
    >
      <span className="text-sm font-medium">{initials}</span>
    </div>
  );
}



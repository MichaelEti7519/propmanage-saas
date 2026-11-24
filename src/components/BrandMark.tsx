interface BrandMarkProps {
  size?: number;
  tone?: 'dark' | 'light';
  className?: string;
}

export function BrandMark({ size = 36, tone = 'dark', className = '' }: BrandMarkProps) {
  const colors = tone === 'light'
    ? { surface: '#E8DDCC', roof: '#397451', detail: '#332D29' }
    : { surface: '#332D29', roof: '#B9A58B', detail: '#FAF8F3' };

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-[10px] ${className}`}
      style={{ width: size, height: size, backgroundColor: colors.surface }}
    >
      <svg viewBox="0 0 40 40" width={size * 0.72} height={size * 0.72} fill="none">
        <path d="M7 18.2 20 8l13 10.2" stroke={colors.roof} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 17v14.5h19V17" stroke={colors.detail} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 31.5v-8a4 4 0 0 1 8 0v8" stroke={colors.detail} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.5 20h2v2.5h-2zM24.5 20h2v2.5h-2z" fill={colors.roof} />
      </svg>
    </span>
  );
}
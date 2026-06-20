export default function EcoMirrorLogo({ size = 'default', dark = false }) {
  const sizeClasses = {
    small: 'w-7 h-7',
    default: 'w-8 h-8',
    large: 'w-9 h-9',
  };

  const iconSizes = {
    small: 'w-3.5 h-3.5',
    default: 'w-4 h-4',
    large: 'w-5 h-5',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center flex-shrink-0`}
      style={{ background: 'linear-gradient(135deg, #1e8e3e, #34a853)' }}
    >
      <svg className={`${iconSizes[size]} text-white`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
      </svg>
    </div>
  );
}

export function EcoMirrorBrand({ size = 'default', dark = false }) {
  const textSizes = {
    small: 'text-sm',
    default: 'text-base',
    large: 'text-lg',
  };

  const accentColor = dark ? '#34a853' : '#1e8e3e';

  return (
    <span className={`${textSizes[size]} font-extrabold`} style={{ color: dark ? '#fff' : 'var(--foreground)' }}>
      Eco<span style={{ color: accentColor }}>Mirror</span>
    </span>
  );
}

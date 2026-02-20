interface IconProps {
  className?: string;
}

export function WelcomingPosture({ className = "w-16 h-16" }: IconProps) {
  return (
    <svg viewBox="0 0 80 100" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="40" cy="12" r="9" />
      <path d="M40 24c-5 0-9 4-9 9v18h4v40h10V51h4V33c0-5-4-9-9-9z" />
      <path d="M31 30 L10 18c-2.5-1.5-5 1-3 3.5L25 38" />
      <path d="M49 30 L70 18c2.5-1.5 5 1 3 3.5L55 38" />
      <circle cx="8" cy="16" r="3" />
      <circle cx="72" cy="16" r="3" />
    </svg>
  );
}

export function ConfidentPosture({ className = "w-16 h-16" }: IconProps) {
  return (
    <svg viewBox="0 0 80 100" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="40" cy="12" r="9" />
      <path d="M40 24c-6 0-10 4-10 10v17h5v40h10V51h5V34c0-6-4-10-10-10z" />
      <path d="M30 32 L14 38c-2 .8-2 3 0 3.5L30 44" />
      <path d="M50 32 L66 38c2 .8 2 3 0 3.5L50 44" />
      <ellipse cx="12" cy="40" rx="4" ry="3" />
      <ellipse cx="68" cy="40" rx="4" ry="3" />
    </svg>
  );
}

export function WarmPosture({ className = "w-16 h-16" }: IconProps) {
  return (
    <svg viewBox="0 0 80 100" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="40" cy="12" r="9" />
      <path d="M40 24c-5 0-9 4-9 9v18h4v40h10V51h4V33c0-5-4-9-9-9z" />
      <path d="M31 30 L20 26 L16 36c-1 2.5 1 4 3 3L31 38" />
      <path d="M49 30 L58 34c2 1 1.5 3.5-.5 3.5L49 38" />
      <ellipse cx="36" cy="40" rx="5" ry="4.5" />
    </svg>
  );
}

export function MotivatedPosture({ className = "w-16 h-16" }: IconProps) {
  return (
    <svg viewBox="0 0 80 100" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="40" cy="12" r="9" />
      <path d="M40 24c-5 0-9 4-9 9v15h4v15l-6 24c-.5 2 1 3 2.5 2l5-8 5 8c1.5 1 3 0 2.5-2L38 63V48h4V33c0-5-4-9-9-9z" />
      <path d="M49 28 L62 8c1-2 4-1 3.5 1.5L52 34" />
      <path d="M31 30 L18 38c-2 1-1 4 1 3.5L31 38" />
      <polygon points="64,4 68,2 66,7" />
      <polygon points="60,2 63,0 63,5" />
      <polygon points="67,8 71,7 69,11" />
    </svg>
  );
}

export function InspiredPosture({ className = "w-16 h-16" }: IconProps) {
  return (
    <svg viewBox="0 0 80 100" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="40" cy="18" r="9" />
      <path d="M40 30c-5 0-9 4-9 9v14h4v38h10V53h4V39c0-5-4-9-9-9z" />
      <path d="M31 34 L14 10c-1.5-2 1-4.5 3-3L33 28" />
      <path d="M49 34 L66 10c1.5-2-1-4.5-3-3L47 28" />
      <circle cx="12" cy="6" r="2.5" />
      <circle cx="68" cy="6" r="2.5" />
      <line x1="10" y1="1" x2="14" y2="0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="66" y1="1" x2="70" y2="0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ComfortablePosture({ className = "w-16 h-16" }: IconProps) {
  return (
    <svg viewBox="0 0 80 100" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="40" cy="12" r="9" />
      <path d="M40 24c-5 0-9 3-9 8v16h18V32c0-5-4-8-9-8z" />
      <path d="M31 30 L22 28c-2-.5-3 1.5-2 3l5 5h6" />
      <path d="M49 30 L56 32c2 .5 2 3 0 3.5L49 36" />
      <rect x="10" y="48" width="60" height="7" rx="3.5" />
      <path d="M18 48V40c0-2 2-4 4-4h4v12z" />
      <path d="M62 48V40c0-2-2-4-4-4h-4v12z" />
      <path d="M26 55 L22 80c-.5 2 1 3.5 2.5 2.5L30 72" />
      <path d="M54 55 L58 80c.5 2-1 3.5-2.5 2.5L50 72" />
      <path d="M34 55 L32 75c-.3 2 1 3 2.5 2L38 72" />
      <path d="M46 55 L48 75c.3 2-1 3-2.5 2L42 72" />
    </svg>
  );
}

export function ReassuredPosture({ className = "w-16 h-16" }: IconProps) {
  return (
    <svg viewBox="0 0 80 100" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="40" cy="12" r="9" />
      <path d="M40 24c-7 0-12 4-12 10v20h6v37h12V54h6V34c0-6-5-10-12-10z" />
      <path d="M28 34 L18 32c-3-.5-4 2-2 4l8 4h4" />
      <path d="M52 34 L62 32c3-.5 4 2 2 4l-8 4h-4" />
      <rect x="30" y="36" width="20" height="10" rx="3" />
    </svg>
  );
}

export const brandMessageIcons: Record<string, (props: IconProps) => JSX.Element> = {
  assured: WelcomingPosture,
  confidence: ConfidentPosture,
  empathy: WarmPosture,
  motivation: MotivatedPosture,
};

export const emotionalImpactIcons: Record<string, (props: IconProps) => JSX.Element> = {
  bright: InspiredPosture,
  cozy: ComfortablePosture,
  powerful: ReassuredPosture,
};

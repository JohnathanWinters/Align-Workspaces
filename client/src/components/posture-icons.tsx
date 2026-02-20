interface IconProps {
  className?: string;
}

export function WelcomingPosture({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="32" cy="10" r="6" />
      <path d="M32 18c-3 0-5 2-5 5v14h3v18h4V37h3V23c0-3-2-5-5-5z" />
      <path d="M22 25c0 0-4-3-7-2s-1 4 1 5l9 5" />
      <path d="M42 25c0 0 4-3 7-2s1 4-1 5l-9 5" />
    </svg>
  );
}

export function ConfidentPosture({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="32" cy="10" r="6" />
      <path d="M27 18h10c2.5 0 4.5 2 4.5 4.5V32h-4v-5l-1.5 1v27h-4V38h-2v17h-4V28l-1.5-1v5h-4V22.5c0-2.5 2-4.5 4.5-4.5z" />
      <path d="M21 28h-3c-1 0-2-.8-2-1.8V24c0-1 1-2 2-2h3" />
      <path d="M43 28h3c1 0 2-.8 2-1.8V24c0-1-1-2-2-2h-3" />
    </svg>
  );
}

export function WarmPosture({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="32" cy="10" r="6" />
      <path d="M27 18h10c2.5 0 4.5 2 4.5 4.5V37h-3v18h-4V38h-2v17h-4V37h-3V22.5c0-2.5 2-4.5 4.5-4.5z" />
      <path d="M27 22l-5 4-3 8c-.5 1.5.5 2.5 1.5 2l6-6" />
      <path d="M37 22l3 2v7c0 1.2 1 2 2 1.5l1-1V26l-2-4" />
    </svg>
  );
}

export function MotivatedPosture({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="34" cy="10" r="6" />
      <path d="M29 18h10c2.5 0 4.5 2 4.5 4.5V30l3-2v-5c0-1 1.5-1.5 2 0v9l-5 5v18h-4V40h-2v15h-4V36l-5-5v-9c.5-1.5 2-1 2 0v5l3 2V22.5c0-2.5 2-4.5 4.5-4.5z" />
    </svg>
  );
}

export function InspiredPosture({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="32" cy="12" r="6" />
      <path d="M27 20h10c2.5 0 4.5 2 4.5 4.5V30h-3v25h-4V40h-2v15h-4V30h-3V24.5c0-2.5 2-4.5 4.5-4.5z" />
      <path d="M27 20l-6-8c-.7-1 .3-2.2 1.3-1.5L27 15" />
      <path d="M37 20l6-8c.7-1-.3-2.2-1.3-1.5L37 15" />
    </svg>
  );
}

export function ComfortablePosture({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="32" cy="10" r="6" />
      <path d="M27 18h10c2 0 3.5 1.5 3.5 3.5v8c0 1-.5 2-1.5 2.5V37h2c2 0 3 1.5 3 3v2H20v-2c0-1.5 1-3 3-3h2v-5c-1-.5-1.5-1.5-1.5-2.5v-8c0-2 1.5-3.5 3.5-3.5z" />
      <path d="M24 42h16v3H24z" />
      <path d="M22 45l-2 10h4l2-7h12l2 7h4l-2-10" />
    </svg>
  );
}

export function ReassuredPosture({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="32" cy="10" r="6" />
      <path d="M25 18h14c2.5 0 4.5 2 4.5 4.5V37h-3v18h-5V38h-2v17h-5V37h-3V22.5c0-2.5 2-4.5 4.5-4.5z" />
      <path d="M25 24l-2 2v5l4 2v-6z" />
      <path d="M39 24l2 2v5l-4 2v-6z" />
      <rect x="28" y="25" width="8" height="6" rx="1" />
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

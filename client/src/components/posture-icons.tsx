interface IconProps {
  className?: string;
}

export function WelcomingPosture({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 48 72" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="24" cy="8" r="6.5" />
      <path d="M24 17c-4 0-7 3-7 7v4l-7-2.5c-2-.7-3.5.8-2.8 2.5L12 38l5-3v-5" />
      <path d="M24 17c4 0 7 3 7 7v4l7-2.5c2-.7 3.5.8 2.8 2.5L36 38l-5-3v-5" />
      <rect x="17" y="17" width="14" height="22" rx="4" />
      <rect x="19" y="39" width="4" height="24" rx="2" />
      <rect x="25" y="39" width="4" height="24" rx="2" />
    </svg>
  );
}

export function ConfidentPosture({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 48 72" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="24" cy="8" r="6.5" />
      <rect x="17" y="17" width="14" height="22" rx="4" />
      <path d="M17 22l-5 3v8c0 1.5 1.2 2 2.2 1.2L17 31" />
      <path d="M31 22l5 3v8c0 1.5-1.2 2-2.2 1.2L31 31" />
      <polygon points="14 30 10 33 10 28" />
      <polygon points="34 30 38 33 38 28" />
      <rect x="17" y="39" width="4.5" height="24" rx="2" />
      <rect x="26.5" y="39" width="4.5" height="24" rx="2" />
    </svg>
  );
}

export function WarmPosture({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 48 72" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="24" cy="8" r="6.5" />
      <rect x="17" y="17" width="14" height="22" rx="4" />
      <path d="M17 22l-4 6 2 6 4 1c1.2.3 1.5-.8.8-1.5L17 30" />
      <path d="M31 20l4 2c1.5.8 1.8 2.5.5 3.5l-4 3" />
      <circle cx="22" cy="30" r="2.5" />
      <rect x="18" y="39" width="4" height="24" rx="2" />
      <rect x="26" y="39" width="4" height="22" rx="2" />
    </svg>
  );
}

export function MotivatedPosture({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 48 72" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="26" cy="8" r="6.5" />
      <rect x="19" y="17" width="14" height="20" rx="4" />
      <path d="M33 20l5-7c1-1.5 3-.5 2.5 1L37 22" />
      <path d="M19 24l-5 5c-1 1-.3 2.8 1 2.5l6-2" />
      <path d="M20 37l-3 15c-.3 1.5.8 2.5 2 2l3-4 3 6c.8 1.5 2.5 1 2.5-.5l1-18" />
      <path d="M28 37l5 13c.5 1.5 2.2 1.5 2.5 0l-1-13" />
    </svg>
  );
}

export function InspiredPosture({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 48 72" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="24" cy="12" r="6.5" />
      <rect x="17" y="21" width="14" height="20" rx="4" />
      <path d="M17 24l-5-10c-.8-1.5.5-3 2-2l5 6" />
      <path d="M31 24l5-10c.8-1.5-.5-3-2-2l-5 6" />
      <rect x="19" y="41" width="4" height="22" rx="2" />
      <rect x="25" y="41" width="4" height="22" rx="2" />
    </svg>
  );
}

export function ComfortablePosture({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 48 72" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="24" cy="8" r="6.5" />
      <rect x="17" y="17" width="14" height="18" rx="4" />
      <path d="M17 22l-5 4c-1 .8-.5 2.5 1 2.5h4" />
      <path d="M31 20l3 1v7c0 1-1 1.5-2 1h-1" />
      <rect x="12" y="35" width="24" height="5" rx="2.5" />
      <path d="M14 40l-3 22c-.3 1.5 1 2.5 2.2 2l3-4" />
      <path d="M34 40l3 22c.3 1.5-1 2.5-2.2 2l-3-4" />
      <path d="M18 40l2 12c.3 1 1.5 1 1.8 0l2-12" />
      <path d="M25 40l2 12c.3 1 1.5 1 1.8 0l2-12" />
    </svg>
  );
}

export function ReassuredPosture({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 48 72" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="24" cy="8" r="6.5" />
      <rect x="15" y="17" width="18" height="24" rx="5" />
      <path d="M15 24l-2 4h4" />
      <path d="M33 24l2 4h-4" />
      <rect x="18" y="26" width="12" height="7" rx="2" />
      <rect x="16" y="41" width="5" height="22" rx="2.5" />
      <rect x="27" y="41" width="5" height="22" rx="2.5" />
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

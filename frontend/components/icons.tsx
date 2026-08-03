// Small inline outline icons for card/section headers — kept as hand-written
// SVG (no icon library dependency) to match the pattern already used for map
// pins and status glyphs elsewhere in the app.

type IconProps = { className?: string };

export function MapPinIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M10 2c-3.31 0-6 2.6-6 5.9C4 12.5 10 18 10 18s6-5.5 6-10.1C16 4.6 13.31 2 10 2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function TargetIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="10" cy="10" r="3.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="10" cy="10" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function TableIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <rect x="2.5" y="3.5" width="15" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 8h15M2.5 12.3h15M7.5 3.5v13" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function DatabaseIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <ellipse cx="10" cy="4.8" rx="6.5" ry="2.3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 4.8v10.4c0 1.27 2.91 2.3 6.5 2.3s6.5-1.03 6.5-2.3V4.8"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M3.5 10c0 1.27 2.91 2.3 6.5 2.3s6.5-1.03 6.5-2.3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function CpuIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <rect x="5.5" y="5.5" width="9" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="8.2" y="8.2" width="3.6" height="3.6" rx="0.6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 2.3v2M10 15.7v2M2.3 10h2M15.7 10h2M5 5v0M15 5v0M5 15v0M15 15v0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChartBarIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M3.5 16.5v-5M8 16.5V6M12.5 16.5v-8.5M17 16.5V3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9v4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="10" cy="6.3" r="0.95" fill="currentColor" />
    </svg>
  );
}

export function GridIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function WarningIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M10 2.5l8.5 14.7a1 1 0 01-.87 1.5H2.37a1 1 0 01-.87-1.5L10 2.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 8v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.8" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.7 10.2l2.2 2.2 4.4-4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PersonIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <circle cx="10" cy="6.5" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 17c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <rect x="2.5" y="4" width="15" height="13.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ArchiveIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <rect x="2.5" y="3" width="15" height="4" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 7v8.5a1.5 1.5 0 001.5 1.5h10a1.5 1.5 0 001.5-1.5V7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg width="10" height="10" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={`shrink-0 ${className ?? ""}`}>
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg width="10" height="10" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M12.5 4.5l-6 5.5 6 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M7.5 4.5l6 5.5-6 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrendUpIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M2.5 14l4.5-5 3 3 6.5-7.5M13 4.5h3.5V8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

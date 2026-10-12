import type { CSSProperties, ReactNode } from 'react';

const WINDOW_FILL = '#ffffff';
const WINDOW_OPACITY = 0.85;

/** Wheel drawn as a ring so it reads well on light and selected backgrounds. */
function Wheel({ cx, cy = 28.5, r = 4.5 }: { cx: number; cy?: number; r?: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="currentColor" />
      <circle cx={cx} cy={cy} r={r * 0.42} fill={WINDOW_FILL} fillOpacity={WINDOW_OPACITY} />
    </>
  );
}

function Body({ body, windows }: { body: string; windows?: string }) {
  return (
    <>
      <path d={body} fill="currentColor" />
      {windows && <path d={windows} fill={WINDOW_FILL} fillOpacity={WINDOW_OPACITY} />}
    </>
  );
}

/** Side-profile silhouettes (viewBox 64×36), keyed by `VehicleType.iconName`. */
const SHAPES: Record<string, ReactNode> = {
  auto: (
    <>
      <Body
        body="M3 27V22c0-2 1.5-3.2 3.5-3.6L15 17l7.5-6.2c1-.8 2.2-1.3 3.5-1.3h11c1.4 0 2.7.6 3.6 1.6L46 17l9.5 1.3c2.5.4 4.5 2 4.5 4.5V27z"
        windows="M24 12.5h6.5V17H18.5zM33 12.5h4.2c.8 0 1.5.3 2 .9L43 17H33z"
      />
      <Wheel cx={15} />
      <Wheel cx={48} />
    </>
  ),
  suv: (
    <>
      <Body
        body="M3 27v-7c0-1.6 1.2-2.9 2.8-3.1L12 16l5-6.5c.8-1 2-1.5 3.2-1.5h24c1.3 0 2.5.6 3.3 1.6L53 16l5.5.9c1.5.3 2.5 1.6 2.5 3.1v7z"
        windows="M19.5 10.5H29V16H15.5zM31.5 10.5h12c.6 0 1.1.3 1.5.8L49 16H31.5z"
      />
      <Wheel cx={15} />
      <Wheel cx={49} />
    </>
  ),
  pickup: (
    <>
      <Body
        body="M3 27v-6.5c0-1.4 1-2.6 2.4-2.9L13 16l5.5-6.8c.7-.8 1.7-1.2 2.7-1.2H33v10h27.5c.8 0 1.5.7 1.5 1.5V27z"
        windows="M20.5 10H30.5v6H15.5z"
      />
      <Wheel cx={14} />
      <Wheel cx={50} />
    </>
  ),
  pickup_large: (
    <>
      <Body
        body="M2 27v-8c0-1.5 1.1-2.8 2.6-3L11 15l4.5-8c.6-1 1.7-1.6 2.8-1.6H50c1.2 0 2.3.7 2.9 1.8L57 15l3.2.6c1.6.3 2.8 1.7 2.8 3.3V27z"
        windows="M18 8H28v7H13.5zM30.5 8H40v7H30.5zM42.5 8h6.3c.6 0 1.1.3 1.4.8L54 15H42.5z"
      />
      <Wheel cx={14} r={5} />
      <Wheel cx={51} r={5} />
    </>
  ),
  furgon: (
    <>
      <Body
        body="M2 27V8.5C2 7.1 3.1 6 4.5 6H44c1.2 0 2.3.6 3 1.6L55 18l5 1.2c1.7.4 3 1.9 3 3.7V27z"
        windows="M45 9.5l7.5 9H45z"
      />
      <Wheel cx={13} />
      <Wheel cx={51} />
    </>
  ),
  combi: (
    <>
      <Body
        body="M2 27V9c0-2.2 1.8-4 4-4h44c1.6 0 3 .9 3.7 2.4L59 18.5l1.6.5c1.4.4 2.4 1.7 2.4 3.2V27z"
        windows="M6 8.5h8v7H6zM16.5 8.5h8v7h-8zM27 8.5h8v7h-8zM37.5 8.5h8v7h-8zM48 8.5h1.6c.6 0 1.1.3 1.3.9l2.9 6.1H48z"
      />
      <Wheel cx={13} />
      <Wheel cx={51} />
    </>
  ),
  truck: (
    <>
      <Body
        body="M2 26V5.5C2 4.7 2.7 4 3.5 4H40v22zM42 26V11c0-.6.4-1 1-1h10.5c.6 0 1.1.3 1.4.8L61 19.5c.6.9 1 1.9 1 3V26z"
        windows="M45 12.5h8l4.5 7H45z"
      />
      <Wheel cx={11} r={4.8} />
      <Wheel cx={23} r={4.8} />
      <Wheel cx={53} r={4.8} />
    </>
  ),
  moto: (
    <>
      <path
        d="M12 28l11-10h13l6-6h4M46 12l4 16M38 12l-2-4h5"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M21 15h13l-2.5 4H24z" fill="currentColor" />
      <Wheel cx={12} cy={27} r={6.5} />
      <Wheel cx={50} cy={27} r={6.5} />
    </>
  ),
};

/** Legacy / alternate icon keys stored in existing vehicle types. */
const ALIASES: Record<string, string> = {
  van: 'combi',
  camioneta_mediana: 'suv',
  camioneta_grande: 'pickup_large',
};

export function resolveVehicleIconKey(iconName?: string | null): string {
  const key = (iconName ?? '').trim().toLowerCase();
  if (SHAPES[key]) return key;
  return ALIASES[key] ?? 'auto';
}

interface VehicleIconProps {
  iconName?: string | null;
  /** Height in CSS units; width keeps the 16:9 side-profile ratio. Defaults to `1em`. */
  size?: number | string;
  style?: CSSProperties;
  title?: string;
}

/** Side-profile vehicle silhouette that inherits `color` from its parent. */
export function VehicleIcon({ iconName, size = '1em', style, title }: VehicleIconProps) {
  const height = typeof size === 'number' ? `${size}px` : size;
  return (
    <svg
      viewBox="0 0 64 36"
      style={{ height, width: `calc(${height} * 1.78)`, display: 'inline-block', ...style }}
      role="img"
      aria-label={title ?? resolveVehicleIconKey(iconName)}
    >
      {title && <title>{title}</title>}
      {SHAPES[resolveVehicleIconKey(iconName)]}
    </svg>
  );
}

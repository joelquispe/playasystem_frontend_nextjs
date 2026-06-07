import type { CSSProperties } from 'react';

/** Shared Playa ROSE dashboard palette */
export const colors = {
  contentBg: '#ffffff',
  cardBg: '#fbf7f2',
  cardBorder: '#d9cfc4',
  nestedBg: '#ffffff',
  nestedBgMuted: '#f4ede5',
  sidebarBg: '#fbf7f2',
  text: '#2f3639',
  textMuted: '#65767d',
  textSubtle: '#8a9599',
  primary: '#2f6d73',
  accent: '#db2777',
  divider: '#e8dfd6',
  iconBg: '#edf2ee',
} as const;

export const cardStyle: CSSProperties = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: 12,
};

export const nestedPanelStyle: CSSProperties = {
  background: colors.nestedBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: 8,
};

export const highlightPanelStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
  border: '1px solid #f9a8d4',
  borderRadius: 10,
};

export const titleTextStyle: CSSProperties = {
  color: colors.text,
};

export const mutedTextStyle: CSSProperties = {
  color: colors.textMuted,
};

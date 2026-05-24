/**
 * RAY design system.
 *
 * Palette extracted from the RAY chatbot mascot:
 *   white body · deep purple visor · cyan eyes · soft lilac aura.
 *
 * Roles tint the page background automatically:
 *   employee = soft lilac · admin = deeper violet · executive = neutral (untouched)
 *
 * This file preserves the existing export names (`unifiedTheme`, `cardStyle`,
 * `sectionHeaderStyle`, `statCardStyle`, `buttonStyles`, `inputStyle`,
 * `badgeStyle`) so every component that already imports them keeps working —
 * they just look like RAY now instead of generic blue.
 */

// =====================================================================
// Core RAY palette
// =====================================================================

export const rayColors = {
  white: '#FFFFFF',
  paper: '#FBFAFD',

  ink: '#1E1240',
  inkSoft: '#2D1B5C',
  inkMuted: '#5A4A8A',

  purple50:  '#F4EFFF',
  purple100: '#EDE7FF',
  purple200: '#DDD0FF',
  purple300: '#C9BBFF',
  purple400: '#9B7FFF',
  purple500: '#7B5BFF',
  purple600: '#6041F0',
  purple700: '#4A2FCC',

  cyan50:  '#E6FCFF',
  cyan100: '#C6F7FF',
  cyan200: '#7DF0FF',
  cyan400: '#22D3EE',
  cyan500: '#00B8D4',
  cyan600: '#0891B2',
  cyan700: '#0E7490',

  success: '#0E7C66',
  warning: '#B45309',
  danger:  '#E11D48',

  borderSoft:  '#EDE7FF',
  borderMid:   '#DDD0FF',
  borderStrong:'#C9BBFF',
} as const

// =====================================================================
// Role tinting
// =====================================================================

export type RayRole = 'employee' | 'admin' | 'executive'

export interface RayTint {
  pageBackground: string
  cardBorder: string
  accent: string
  accentDark: string
  roleLabel: string
  statStrip: string
}

export const rayTints: Record<RayRole, RayTint> = {
  employee: {
    pageBackground: 'linear-gradient(180deg, #FBFAFD 0%, #F4EFFF 100%)',
    cardBorder: rayColors.borderSoft,
    accent: rayColors.purple500,
    accentDark: rayColors.purple700,
    roleLabel: rayColors.purple500,
    statStrip: rayColors.purple400,
  },
  admin: {
    pageBackground: 'linear-gradient(180deg, #FBFAFD 0%, #EDE7FF 100%)',
    cardBorder: rayColors.borderMid,
    accent: rayColors.inkSoft,
    accentDark: rayColors.ink,
    roleLabel: rayColors.inkSoft,
    statStrip: rayColors.purple500,
  },
  executive: {
    pageBackground: '#faf9fb',
    cardBorder: '#e2e8f0',
    accent: '#0f172a',
    accentDark: '#020617',
    roleLabel: '#475569',
    statStrip: '#0f172a',
  },
}

export function getRayTint(role: RayRole | undefined): RayTint {
  if (!role || !(role in rayTints)) return rayTints.employee
  return rayTints[role]
}

export const rayTypography = {
  // Single source of truth for the font: the --font-sans CSS variable
  // that Next injects from app/layout.tsx (Geist). Every inline-styled
  // page inherits the same font as the Tailwind components.
  family: "var(--font-sans)",
  h1: { fontSize: 24, fontWeight: 600, letterSpacing: '-0.3px', color: rayColors.ink },
  h2: { fontSize: 18, fontWeight: 600, color: rayColors.ink },
  h3: { fontSize: 14, fontWeight: 600, color: rayColors.ink },
  body: { fontSize: 13, fontWeight: 400, color: rayColors.inkMuted, lineHeight: 1.6 },
  label: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
  },
}

export const rayMascotByRole: Record<RayRole, string> = {
  employee: '/ray-robot.png',
  admin: '/ray-admin.png',
  executive: '/ray-executive.png',
}

// =====================================================================
// Legacy-compatible exports — same NAMES, RAY palette inside.
// Existing components import these and don't need to be touched.
// =====================================================================

export const unifiedTheme = {
  colors: {
    primary: {
      main: rayColors.purple500,
      dark: rayColors.purple700,
      gradient: `linear-gradient(135deg, ${rayColors.purple500}, ${rayColors.purple700})`,
    },
    secondary: {
      main: rayColors.cyan500,
      dark: rayColors.cyan700,
      gradient: `linear-gradient(135deg, ${rayColors.cyan500}, ${rayColors.cyan700})`,
    },
    accent: {
      main: rayColors.purple400,
      dark: rayColors.purple600,
      gradient: `linear-gradient(135deg, ${rayColors.purple400}, ${rayColors.purple600})`,
    },
    success: {
      main: rayColors.success,
      dark: rayColors.success,
      gradient: `linear-gradient(135deg, ${rayColors.success}, ${rayColors.success})`,
    },
    warning: {
      main: rayColors.warning,
      dark: rayColors.warning,
      gradient: `linear-gradient(135deg, ${rayColors.warning}, ${rayColors.warning})`,
    },
    danger: {
      main: rayColors.danger,
      dark: rayColors.danger,
      gradient: `linear-gradient(135deg, ${rayColors.danger}, ${rayColors.danger})`,
    },
  },
  text: {
    primary: rayColors.ink,
    secondary: rayColors.inkMuted,
    muted: '#9088A8',
    light: '#FFFFFF',
    inverse: '#FFFFFF',
  },
  backgrounds: {
    // Page now carries the subtle lilac gradient by default — matches the
    // chat interface and the new dashboards.
    page: 'linear-gradient(180deg, #FBFAFD 0%, #F4EFFF 100%)',
    card: rayColors.white,
    light: rayColors.purple50,
    dark: rayColors.purple100,
    subtle: rayColors.purple50,
  },
  borders: {
    light: rayColors.borderSoft,
    medium: rayColors.borderMid,
    strong: rayColors.borderStrong,
    dark: rayColors.purple500,
  },
  shadows: {
    sm: '0 1px 2px rgba(45, 27, 92, 0.04)',
    md: '0 1px 2px rgba(45, 27, 92, 0.04), 0 1px 3px rgba(45, 27, 92, 0.06)',
    lg: '0 2px 8px rgba(45, 27, 92, 0.06), 0 4px 16px rgba(45, 27, 92, 0.08)',
  },
  typography: {
    family: rayTypography.family,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 14,
    xl: 20,
    full: 9999,
  },
}

export const cardStyle = {
  background: rayColors.white,
  borderRadius: 14,
  boxShadow: '0 1px 2px rgba(45, 27, 92, 0.04), 0 1px 3px rgba(45, 27, 92, 0.06)',
  padding: 24,
  border: `1px solid ${rayColors.borderSoft}`,
}

export const sectionHeaderStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 6,
  marginBottom: 24,
}

export const statCardStyle = {
  background: rayColors.white,
  padding: 24,
  borderRadius: 14,
  color: rayColors.ink,
  boxShadow: '0 1px 2px rgba(45, 27, 92, 0.04), 0 1px 3px rgba(45, 27, 92, 0.06)',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'space-between',
  minHeight: 140,
  border: `1px solid ${rayColors.borderSoft}`,
}

export const buttonStyles = {
  primary: {
    background: rayColors.purple500,
    color: '#ffffff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 10,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(45, 27, 92, 0.10), inset 0 1px 0 rgba(255,255,255,0.12)',
    fontSize: 14,
    transition: 'background 0.15s ease, transform 0.05s ease',
  },
  secondary: {
    background: rayColors.white,
    color: rayColors.ink,
    border: `1px solid ${rayColors.borderMid}`,
    padding: '10px 18px',
    borderRadius: 10,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
    boxShadow: '0 1px 2px rgba(45, 27, 92, 0.04)',
    transition: 'background 0.15s ease, border-color 0.15s ease',
  },
  ghost: {
    background: 'transparent',
    color: rayColors.purple600,
    border: '1px solid transparent',
    padding: '10px 18px',
    borderRadius: 10,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
    transition: 'background 0.15s ease',
  },
}

export const inputStyle = {
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${rayColors.borderMid}`,
  fontSize: 14,
  fontFamily: rayTypography.family,
  width: '100%' as const,
  boxSizing: 'border-box' as const,
  background: rayColors.white,
  color: rayColors.ink,
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
}

export const badgeStyle = (background: string, color = '#ffffff') => ({
  background,
  color,
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
})

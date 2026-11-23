/**
 * Design tokens shared by the website and the mobile app.
 * The website mirrors these as CSS variables in `apps/web/src/app/globals.css`; keep them in sync.
 */
export const palette = {
  light: {
    background: "#f7f9f9",
    surface: "#ffffff",
    surfaceMuted: "#eef3f3",
    text: "#0f1f24",
    textMuted: "#51646a",
    border: "#d9e2e3",
    primary: "#0b6e6a",
    primaryText: "#ffffff",
    primarySoft: "#e0f1ef",
    danger: "#b42318",
    dangerSoft: "#fdecea",
    warning: "#9a5b00",
    warningSoft: "#fff4e0",
    info: "#1d5fa8",
    infoSoft: "#e8f0fb",
  },
  dark: {
    background: "#0c1416",
    surface: "#132125",
    surfaceMuted: "#1a2c31",
    text: "#e8f1f2",
    textMuted: "#9db1b6",
    border: "#26393e",
    primary: "#4cc3b8",
    primaryText: "#062a28",
    primarySoft: "#123a37",
    danger: "#ff8a7a",
    dangerSoft: "#3a1714",
    warning: "#f5b74e",
    warningSoft: "#36260b",
    info: "#8cb8ef",
    infoSoft: "#14263d",
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type Colors = { [K in keyof (typeof palette)["light"]]: string };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const fontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28 } as const;

export const fontWeight = { regular: "400", medium: "500", semibold: "600", bold: "700" } as const;

/** Colour role for each label section, most serious first. */
export const sectionTone = {
  boxed_warning: "danger",
  contraindications: "danger",
  warnings_and_cautions: "warning",
  warnings: "warning",
  precautions: "warning",
  do_not_use: "danger",
  ask_doctor: "warning",
  ask_doctor_or_pharmacist: "warning",
  pregnancy_or_breast_feeding: "warning",
  drug_interactions: "info",
} as const;
export type Tone = (typeof sectionTone)[keyof typeof sectionTone];

import { type Colors, palette, type Tone } from "@drugreview/ui";
import { useColorScheme } from "react-native";

export function useColors(): Colors {
  return palette[useColorScheme() === "dark" ? "dark" : "light"];
}

/** Text and background colours for a tone (badges, cards). */
export function toneColors(colors: Colors, tone: Tone | "primary" | "neutral") {
  switch (tone) {
    case "danger":
      return { fg: colors.danger, bg: colors.dangerSoft };
    case "warning":
      return { fg: colors.warning, bg: colors.warningSoft };
    case "info":
      return { fg: colors.info, bg: colors.infoSoft };
    case "primary":
      return { fg: colors.primary, bg: colors.primarySoft };
    default:
      return { fg: colors.textMuted, bg: colors.surfaceMuted };
  }
}

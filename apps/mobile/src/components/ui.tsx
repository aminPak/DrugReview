import { fontSize, fontWeight, radius, spacing, type Tone } from "@drugreview/ui";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

import { toneColors, useColors } from "@/lib/theme";

export function Card({
  children,
  style,
  tone,
}: {
  children: ReactNode;
  style?: ViewStyle;
  tone?: Tone | "primary" | "neutral";
}) {
  const colors = useColors();
  const toneStyle = tone
    ? { backgroundColor: toneColors(colors, tone).bg, borderColor: "transparent" }
    : null;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        toneStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

type TextVariant = "title" | "heading" | "body" | "muted" | "small";

export function AppText({
  children,
  variant = "body",
  style,
  color,
}: {
  children: ReactNode;
  variant?: TextVariant;
  style?: TextStyle;
  color?: string;
}) {
  const colors = useColors();
  const base: Record<TextVariant, TextStyle> = {
    title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
    heading: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
    body: { fontSize: fontSize.md, lineHeight: 22, color: colors.text },
    muted: { fontSize: fontSize.sm, lineHeight: 20, color: colors.textMuted },
    small: { fontSize: fontSize.xs, color: colors.textMuted },
  };
  return <Text style={[base[variant], color ? { color } : null, style]}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  disabled,
  busy,
  variant = "primary",
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: "primary" | "outline";
  icon?: ReactNode;
}) {
  const colors = useColors();
  const primary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary
          ? { backgroundColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
        (disabled || busy) && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {busy ? <ActivityIndicator color={primary ? colors.primaryText : colors.primary} /> : icon}
      <Text style={[styles.buttonText, { color: primary ? colors.primaryText : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Badge({ label, tone }: { label: string; tone: Tone | "primary" | "neutral" }) {
  const colors = useColors();
  const { fg, bg } = toneColors(colors, tone);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  buttonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});

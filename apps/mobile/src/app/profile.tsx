import { conditionName, type ProfileCondition, searchConditions } from "@drugreview/core";
import { fontSize, radius, spacing } from "@drugreview/ui";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { m } from "@/lib/app";
import { conditionKey, useCabinet } from "@/lib/cabinet";
import { useColors } from "@/lib/theme";

export default function ProfileScreen() {
  const colors = useColors();
  const { conditions, addCondition, removeCondition, hasCondition } = useCabinet();
  const [query, setQuery] = useState("");

  const q = query.trim();
  const matches = searchConditions(q, 8);
  const custom: ProfileCondition = { custom: q };
  const canAddCustom =
    q.length >= 3 &&
    !matches.some((c) => c.name.toLowerCase() === q.toLowerCase()) &&
    !hasCondition(custom);

  function add(condition: ProfileCondition) {
    addCondition(condition);
    setQuery("");
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <AppText variant="muted">{m.profile.intro}</AppText>

      {conditions.length === 0 ? (
        <Card>
          <AppText variant="heading">{m.profile.emptyTitle}</AppText>
          <AppText variant="muted">{m.profile.emptyBody}</AppText>
        </Card>
      ) : (
        <View style={styles.chips}>
          {conditions.map((condition) => (
            <Pressable
              key={conditionKey(condition)}
              accessibilityRole="button"
              accessibilityLabel={`${m.list.remove} ${conditionName(condition)}`}
              onPress={() => removeCondition(condition)}
              style={[styles.chip, { backgroundColor: colors.primarySoft }]}
            >
              <AppText color={colors.primary}>{conditionName(condition)}</AppText>
              <AppText color={colors.primary}>×</AppText>
            </Pressable>
          ))}
        </View>
      )}

      <AppText variant="heading">{m.profile.searchTitle}</AppText>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={m.profile.placeholder}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      />

      <View>
        {matches.map((condition) => {
          const already = hasCondition({ id: condition.id });
          return (
            <Row
              key={condition.id}
              label={condition.name}
              hint={already ? m.list.alreadyAdded : "+"}
              disabled={already}
              onPress={() => add({ id: condition.id })}
            />
          );
        })}
        {canAddCustom && (
          <Row label={m.profile.addCustom(q)} hint="+" onPress={() => add(custom)} />
        )}
      </View>
      {q.length >= 3 && <AppText variant="small">{m.profile.customHint}</AppText>}
    </ScrollView>
  );
}

function Row({
  label,
  hint,
  disabled,
  onPress,
}: {
  label: string;
  hint: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border },
        pressed && { backgroundColor: colors.surfaceMuted },
      ]}
    >
      <AppText style={styles.flex}>{label}</AppText>
      <AppText variant="muted">{hint}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl * 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

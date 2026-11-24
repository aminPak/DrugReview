import {
  type CabinetItem,
  canRunCheck,
  conditionName,
  displayName,
  itemKey,
} from "@drugreview/core";
import { radius, spacing } from "@drugreview/ui";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Badge, Button, Card } from "@/components/ui";
import { m } from "@/lib/app";
import { conditionKey, useCabinet } from "@/lib/cabinet";
import { useColors } from "@/lib/theme";

export default function MyListScreen() {
  const { ready, items, remove, noticeAccepted, conditions } = useCabinet();
  const checkable = canRunCheck(items.length, conditions.length);
  const colors = useColors();

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!noticeAccepted) return <Notice />;

  return (
    <SafeAreaView edges={["bottom"]} style={styles.flex}>
      <FlatList
        data={items}
        keyExtractor={itemKey}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <ProfileCard />
            <AppText variant="title">{m.list.title}</AppText>
            <AppText variant="muted">{m.tagline}</AppText>
          </View>
        }
        ListEmptyComponent={
          <Card>
            <AppText variant="heading">{m.list.emptyTitle}</AppText>
            <AppText variant="muted">{m.list.emptyBody}</AppText>
          </Card>
        }
        renderItem={({ item }) => <Row item={item} onRemove={() => remove(item)} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
      <View
        style={[
          styles.actions,
          { borderTopColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        {!checkable && <AppText variant="muted">{m.list.needMore}</AppText>}
        <Button label={m.list.add} variant="outline" onPress={() => router.push("/add")} />
        <Button
          label={m.list.check}
          disabled={!checkable}
          onPress={() => router.push("/results")}
        />
      </View>
    </SafeAreaView>
  );
}

function ProfileCard() {
  const { conditions } = useCabinet();
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push("/profile")}
      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
    >
      <Card tone="primary" style={styles.profile}>
        <View style={styles.profileHeader}>
          <AppText variant="heading">{m.profile.title}</AppText>
          <AppText color={colors.primary}>
            {conditions.length ? m.profile.edit : m.profile.add} ›
          </AppText>
        </View>
        {conditions.length === 0 ? (
          <AppText variant="muted">{m.profile.emptyBody}</AppText>
        ) : (
          <View style={styles.chips}>
            {conditions.map((condition) => (
              <Badge
                key={conditionKey(condition)}
                label={conditionName(condition)}
                tone="primary"
              />
            ))}
          </View>
        )}
      </Card>
    </Pressable>
  );
}

function Row({ item, onRemove }: { item: CabinetItem; onRemove: () => void }) {
  const colors = useColors();
  return (
    <Card style={styles.row}>
      <View style={styles.flex}>
        <AppText variant="heading">{displayName(item.name)}</AppText>
        <Badge
          label={item.kind === "medicine" ? m.list.medicine : m.list.supplement}
          tone={item.kind === "medicine" ? "primary" : "neutral"}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${m.list.remove} ${displayName(item.name)}`}
        onPress={onRemove}
        hitSlop={8}
        style={[styles.remove, { backgroundColor: colors.surfaceMuted }]}
      >
        <AppText variant="muted">{m.list.remove}</AppText>
      </Pressable>
    </Card>
  );
}

function Notice() {
  const { acceptNotice } = useCabinet();
  return (
    <SafeAreaView edges={["bottom"]} style={styles.flex}>
      <View style={styles.notice}>
        <AppText variant="title">{m.notice.title}</AppText>
        {m.notice.points.map((point) => (
          <Card key={point}>
            <AppText>{point}</AppText>
          </Card>
        ))}
        <Button label={m.notice.accept} onPress={acceptNotice} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: spacing.xs, marginBottom: spacing.lg },
  profile: { marginBottom: spacing.lg },
  profileHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  remove: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  actions: { padding: spacing.lg, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  notice: { flex: 1, padding: spacing.lg, gap: spacing.md, justifyContent: "center" },
});

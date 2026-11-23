import {
  displayName,
  isSupplementName,
  type Supplement,
  searchSupplements,
} from "@drugreview/core";
import { fontSize, radius, spacing } from "@drugreview/ui";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { AppText } from "@/components/ui";
import { api, m } from "@/lib/app";
import { useCabinet } from "@/lib/cabinet";
import { useColors } from "@/lib/theme";

type Row = { kind: "medicine"; name: string } | { kind: "supplement"; supplement: Supplement };

export default function AddScreen() {
  const colors = useColors();
  const { add, has } = useCabinet();
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ query: string; names: string[] }>({ query: "", names: [] });
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = query.trim();
  const medicines = found.query === q ? found.names : [];
  const supplements = searchSupplements(q, 6);

  useEffect(() => {
    if (q.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const names = await api.searchDrugs(q);
        if (!cancelled) {
          setFound({ query: q, names: names.filter((name) => !isSupplementName(name)) });
          setError(null);
        }
      } catch {
        if (!cancelled) setError(m.search.offline);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  async function addMedicine(name: string) {
    setAdding(name);
    setError(null);
    try {
      const drug = await api.resolveDrug(name);
      if (!drug) {
        setError(m.search.couldNotAdd);
        return;
      }
      add({ kind: "medicine", name: displayName(name), rxcui: drug.rxcui });
      router.back();
    } catch {
      setError(m.search.offline);
    } finally {
      setAdding(null);
    }
  }

  function addSupplement(supplement: Supplement) {
    add({ kind: "supplement", name: supplement.name, supplementId: supplement.id });
    router.back();
  }

  const sections = [
    { title: m.search.medicines, data: medicines.map((name): Row => ({ kind: "medicine", name })) },
    {
      title: m.search.supplements,
      data: supplements.map((supplement): Row => ({ kind: "supplement", supplement })),
    },
  ].filter((section) => section.data.length > 0);

  const hint =
    q.length < 2
      ? m.search.typeMore
      : !searching && found.query === q && sections.length === 0
        ? m.search.noResults
        : null;

  return (
    <View style={styles.flex}>
      <View style={styles.searchBar}>
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder={m.search.placeholder}
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={[
            styles.input,
            { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        />
        {searching && <ActivityIndicator color={colors.primary} style={styles.spinner} />}
      </View>
      {error && (
        <AppText color={colors.danger} style={styles.message}>
          {error}
        </AppText>
      )}
      {hint && (
        <AppText variant="muted" style={styles.message}>
          {hint}
        </AppText>
      )}
      <SectionList
        sections={sections}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(row) =>
          row.kind === "medicine" ? `m:${row.name}` : `s:${row.supplement.id}`
        }
        renderSectionHeader={({ section }) => (
          <AppText variant="small" style={styles.sectionHeader}>
            {section.title.toUpperCase()}
          </AppText>
        )}
        renderItem={({ item: row }) => {
          const label = row.kind === "medicine" ? displayName(row.name) : row.supplement.name;
          const already = row.kind === "supplement" && has(`supplement:${row.supplement.id}`);
          const busy = row.kind === "medicine" && adding === row.name;
          return (
            <Pressable
              accessibilityRole="button"
              disabled={busy || already}
              onPress={() =>
                row.kind === "medicine" ? addMedicine(row.name) : addSupplement(row.supplement)
              }
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: colors.border },
                pressed && { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <AppText style={styles.flex}>{label}</AppText>
              {busy ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <AppText variant="muted">{already ? m.list.alreadyAdded : "+"}</AppText>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchBar: { padding: spacing.lg, paddingBottom: spacing.sm },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.md,
  },
  spinner: { position: "absolute", right: spacing.xxl, top: spacing.lg + 15 },
  message: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

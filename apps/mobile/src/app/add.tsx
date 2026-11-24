import {
  displayName,
  isSupplementName,
  type ProductSearchResult,
  type Supplement,
  searchSupplements,
  titleCase,
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

import { AppText, Button } from "@/components/ui";
import { api, m } from "@/lib/app";
import { useCabinet } from "@/lib/cabinet";
import { useColors } from "@/lib/theme";

type Row =
  | { kind: "product"; product: ProductSearchResult }
  | { kind: "medicine"; name: string }
  | { kind: "supplement"; supplement: Supplement };

const rowKey = (row: Row) =>
  row.kind === "product"
    ? `p:${row.product.din}`
    : row.kind === "medicine"
      ? `m:${row.name}`
      : `s:${row.supplement.id}`;

/** "ibuprofen 200 MG, caffeine 65 MG" */
const ingredientLine = (product: ProductSearchResult) =>
  product.ingredients.map((i) => [i.name, i.strength].filter(Boolean).join(" ")).join(", ");

export default function AddScreen() {
  const colors = useColors();
  const { add, has } = useCabinet();
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{
    query: string;
    names: string[];
    products: ProductSearchResult[];
  }>({ query: "", names: [], products: [] });
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedNote, setAddedNote] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const q = query.trim();
  const medicines = found.query === q ? found.names : [];
  const products = found.query === q ? found.products : [];
  const supplements = searchSupplements(q, 6);

  useEffect(() => {
    if (q.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        // Canadian products and generic names are searched together; one failing doesn't hide
        // the other.
        const [names, products] = await Promise.allSettled([
          api.searchDrugs(q),
          api.searchProducts(q),
        ]);
        if (!cancelled) {
          if (names.status === "rejected" && products.status === "rejected") {
            setError(m.search.offline);
          } else {
            setFound({
              query: q,
              names:
                names.status === "fulfilled"
                  ? names.value.filter((name) => !isSupplementName(name))
                  : [],
              products: products.status === "fulfilled" ? products.value : [],
            });
            setError(null);
          }
        }
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
      justAdded(displayName(name));
    } catch {
      setError(m.search.offline);
    } finally {
      setAdding(null);
    }
  }

  async function addProduct(product: ProductSearchResult) {
    setAdding(product.din);
    setError(null);
    try {
      const resolved = await api.resolveProduct(product.din);
      if (!resolved) {
        setError(m.search.couldNotAdd);
        return;
      }
      add({ kind: "medicine", name: titleCase(product.name), din: product.din });
      justAdded(titleCase(product.name), resolved.unmatched);
    } catch {
      setError(m.search.offline);
    } finally {
      setAdding(null);
    }
  }

  function addSupplement(supplement: Supplement) {
    add({ kind: "supplement", name: supplement.name, supplementId: supplement.id });
    justAdded(supplement.name);
  }

  /** Stay on this screen so several items can be added; say what was added. */
  function justAdded(name: string, unmatched: string[] = []) {
    setAddedNote(m.search.added(name));
    setWarning(unmatched.length ? m.search.unmatched(unmatched.join(", ")) : null);
    setQuery("");
  }

  const sections = [
    {
      title: m.search.canadianProducts,
      data: products.map((product): Row => ({ kind: "product", product })),
    },
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
      {warning && (
        <AppText color={colors.danger} style={styles.message}>
          {warning}
        </AppText>
      )}
      {addedNote && q.length < 2 && (
        <View accessibilityLiveRegion="polite">
          <AppText color={colors.primary} style={styles.message}>
            {addedNote}
          </AppText>
        </View>
      )}
      {hint && q.length >= 2 && (
        <AppText variant="muted" style={styles.message}>
          {hint}
        </AppText>
      )}
      <SectionList
        sections={sections}
        keyboardShouldPersistTaps="handled"
        keyExtractor={rowKey}
        renderSectionHeader={({ section }) => (
          <AppText variant="small" style={styles.sectionHeader}>
            {section.title.toUpperCase()}
          </AppText>
        )}
        renderItem={({ item: row }) => {
          const label =
            row.kind === "product"
              ? titleCase(row.product.name)
              : row.kind === "medicine"
                ? displayName(row.name)
                : row.supplement.name;
          const detail =
            row.kind === "product"
              ? `${ingredientLine(row.product)} · ${m.search.din(row.product.din)}`
              : null;
          const already =
            (row.kind === "supplement" && has(`supplement:${row.supplement.id}`)) ||
            (row.kind === "product" && has(`din:${row.product.din}`));
          const busy =
            (row.kind === "medicine" && adding === row.name) ||
            (row.kind === "product" && adding === row.product.din);
          return (
            <Pressable
              accessibilityRole="button"
              disabled={busy || already}
              onPress={() =>
                row.kind === "product"
                  ? addProduct(row.product)
                  : row.kind === "medicine"
                    ? addMedicine(row.name)
                    : addSupplement(row.supplement)
              }
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: colors.border },
                pressed && { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <View style={styles.flex}>
                <AppText>{label}</AppText>
                {detail && <AppText variant="small">{detail}</AppText>}
              </View>
              {busy ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <AppText variant="muted">{already ? m.list.alreadyAdded : "+"}</AppText>
              )}
            </Pressable>
          );
        }}
      />
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button label={m.search.done} onPress={() => router.back()} />
      </View>
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
  footer: { padding: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

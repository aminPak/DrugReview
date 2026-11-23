import {
  type CabinetItem,
  findingTitle,
  type InteractionCheckResult,
  pairLabel,
  quietPairs,
  sortFindings,
} from "@drugreview/core";
import { sectionTone, spacing } from "@drugreview/ui";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card } from "@/components/ui";
import { api, m } from "@/lib/app";
import { useCabinet } from "@/lib/cabinet";
import { useColors } from "@/lib/theme";

export default function ResultsScreen() {
  const colors = useColors();
  const { items } = useCabinet();
  const [state, setState] = useState<{
    items: CabinetItem[];
    result: InteractionCheckResult;
  } | null>(null);

  const run = useCallback(async () => {
    setState(null);
    const snapshot = items;
    setState({ items: snapshot, result: await api.checkInteractions(snapshot) });
  }, [items]);

  useEffect(() => {
    // Checking is a network request; its result arrives asynchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run();
  }, [run]);

  if (!state) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText variant="muted">{m.results.checking}</AppText>
      </View>
    );
  }

  const { result } = state;
  if (result.status === "unavailable") {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Card tone="danger">
          <AppText variant="heading" color={colors.danger}>
            {m.results.unavailableTitle}
          </AppText>
          <AppText>{m.results.unavailableBody}</AppText>
        </Card>
        <Button label={m.results.retry} variant="outline" onPress={run} />
      </ScrollView>
    );
  }

  const findings = sortFindings(result.findings);
  const quiet = quietPairs(state.items.length, result.findings, result.unchecked);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.summary}>
        <AppText variant="title">
          {findings.length > 0 ? m.results.foundTitle(findings.length) : m.results.noneFoundTitle}
        </AppText>
        {findings.length === 0 && <AppText variant="muted">{m.results.noneFoundBody}</AppText>}
      </View>

      {findings.map((finding, index) =>
        finding.type === "same_ingredient" ? (
          <Card key={index} style={{ borderColor: colors.danger }}>
            <AppText variant="heading">{findingTitle(finding, state.items, m)}</AppText>
            <AppText variant="muted">{m.results.sameIngredientBody}</AppText>
          </Card>
        ) : (
          <Card key={index}>
            <Badge
              label={m.results.inSection(m.sections[finding.section])}
              tone={sectionTone[finding.section]}
            />
            <AppText variant="heading">{findingTitle(finding, state.items, m)}</AppText>
            <View style={[styles.quote, { borderLeftColor: colors.border }]}>
              <AppText variant="muted">“{finding.excerpt}”</AppText>
            </View>
            <Pressable
              accessibilityRole="link"
              onPress={() => WebBrowser.openBrowserAsync(finding.source.url)}
            >
              <AppText color={colors.primary} style={styles.link}>
                {m.results.openLabel} ↗
              </AppText>
            </Pressable>
          </Card>
        ),
      )}

      {findings.length > 0 && quiet.length > 0 && (
        <Card tone="neutral">
          <AppText variant="heading">{m.results.quietTitle}</AppText>
          <AppText variant="muted">{m.results.quietBody}</AppText>
          {quiet.map((pair) => (
            <AppText key={pair.between.join("-")}>• {pairLabel(pair, state.items)}</AppText>
          ))}
        </Card>
      )}

      {result.unchecked.length > 0 && (
        <Card tone="neutral">
          <AppText variant="heading">{m.results.uncheckedTitle}</AppText>
          <AppText variant="muted">{m.results.uncheckedBody}</AppText>
          {result.unchecked.map((pair) => (
            <AppText key={pair.between.join("-")}>
              • {pairLabel(pair, state.items)}: {m.results.unchecked[pair.reason]}
            </AppText>
          ))}
        </Card>
      )}

      <Card tone="primary">
        <AppText>{m.results.talkToPharmacist}</AppText>
      </Card>
      <AppText variant="small">{m.disclaimer}</AppText>
      <AppText variant="small">
        {m.results.checkedAt(new Date(result.checkedAt).toLocaleString())}
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl * 2 },
  summary: { gap: spacing.xs, marginBottom: spacing.xs },
  quote: { borderLeftWidth: 3, paddingLeft: spacing.md },
  link: { fontWeight: "600" },
});

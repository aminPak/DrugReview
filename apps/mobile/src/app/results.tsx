import {
  type CabinetItem,
  conditionName,
  displayName,
  type Finding,
  findingTitle,
  groupByCondition,
  type InteractionCheckResult,
  pairLabel,
  type ProfileCondition,
  quietConditions,
  quietPairs,
  splitFindings,
  viaNote,
} from "@drugreview/core";
import { sectionTone, spacing } from "@drugreview/ui";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card } from "@/components/ui";
import { api, m } from "@/lib/app";
import { useCabinet } from "@/lib/cabinet";
import { useColors } from "@/lib/theme";

interface Snapshot {
  items: CabinetItem[];
  conditions: ProfileCondition[];
  result: InteractionCheckResult;
}

export default function ResultsScreen() {
  const colors = useColors();
  const { items, conditions } = useCabinet();
  const [state, setState] = useState<Snapshot | null>(null);

  const run = useCallback(async () => {
    setState(null);
    const snapshot = { items, conditions };
    const result = await api.checkInteractions(items, { conditions });
    setState({ ...snapshot, result });
  }, [items, conditions]);

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

  const { forConditions, betweenItems } = splitFindings(result.findings);
  const groups = groupByCondition(forConditions, state.conditions.length);
  const quiet = quietPairs(state.items.length, result.findings, result.unchecked);
  const quietConds = quietConditions(result, state.items.length, state.conditions.length);
  const total = forConditions.length + betweenItems.length;
  const hasUnchecked = result.unchecked.length > 0 || result.uncheckedForConditions.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.summary}>
        <AppText variant="title">
          {total > 0 ? m.results.foundTitle(total) : m.results.noneFoundTitle}
        </AppText>
        {total === 0 && <AppText variant="muted">{m.results.noneFoundBody}</AppText>}
      </View>

      {groups.length > 0 && <AppText variant="heading">{m.results.forConditionsTitle}</AppText>}
      {groups.map((group) => (
        <View key={group.condition} style={styles.group}>
          <AppText variant="muted" style={styles.groupTitle}>
            {m.results.becauseYouHave(conditionName(state.conditions[group.condition]))}
          </AppText>
          {group.findings.map((finding, index) => (
            <FindingCard key={index} finding={finding} snapshot={state} />
          ))}
        </View>
      ))}

      {betweenItems.length > 0 && groups.length > 0 && (
        <AppText variant="heading">{m.results.betweenItemsTitle}</AppText>
      )}
      {betweenItems.map((finding, index) => (
        <FindingCard key={index} finding={finding} snapshot={state} />
      ))}

      {total > 0 && quietConds.length > 0 && (
        <Card tone="neutral">
          <AppText variant="heading">{m.results.quietConditionsTitle}</AppText>
          <AppText variant="muted">{m.results.quietBody}</AppText>
          {quietConds.map((i) => (
            <AppText key={i}>• {conditionName(state.conditions[i])}</AppText>
          ))}
        </Card>
      )}

      {total > 0 && quiet.length > 0 && (
        <Card tone="neutral">
          <AppText variant="heading">{m.results.quietTitle}</AppText>
          <AppText variant="muted">{m.results.quietBody}</AppText>
          {quiet.map((pair) => (
            <AppText key={pair.between.join("-")}>• {pairLabel(pair, state.items)}</AppText>
          ))}
        </Card>
      )}

      {hasUnchecked && (
        <Card tone="neutral">
          <AppText variant="heading">{m.results.uncheckedTitle}</AppText>
          <AppText variant="muted">{m.results.uncheckedBody}</AppText>
          {result.uncheckedForConditions.map((i) => (
            <AppText key={`c${i}`}>
              • {m.results.uncheckedForConditions(displayName(state.items[i]?.name ?? ""))}
            </AppText>
          ))}
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

function FindingCard({ finding, snapshot }: { finding: Finding; snapshot: Snapshot }) {
  const colors = useColors();
  const title = findingTitle(finding, snapshot.items, m, snapshot.conditions);

  if (finding.type === "same_ingredient") {
    return (
      <Card style={{ borderColor: colors.danger }}>
        <AppText variant="heading">{title}</AppText>
        <AppText variant="muted">{m.results.sameIngredientBody}</AppText>
      </Card>
    );
  }

  const via = viaNote(finding, snapshot.items, m);
  return (
    <Card>
      <Badge
        label={m.results.inSection(m.sections[finding.section])}
        tone={sectionTone[finding.section]}
      />
      <AppText variant="heading">{title}</AppText>
      <View style={[styles.quote, { borderLeftColor: colors.border }]}>
        <AppText variant="muted">“{finding.excerpt}”</AppText>
      </View>
      {via && <AppText variant="small">{via}</AppText>}
      <Pressable
        accessibilityRole="link"
        onPress={() => WebBrowser.openBrowserAsync(finding.source.url)}
      >
        <AppText color={colors.primary} style={styles.link}>
          {m.results.openLabel} ↗
        </AppText>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl * 2 },
  summary: { gap: spacing.xs, marginBottom: spacing.xs },
  group: { gap: spacing.sm },
  groupTitle: { fontWeight: "600" },
  quote: { borderLeftWidth: 3, paddingLeft: spacing.md },
  link: { fontWeight: "600" },
});

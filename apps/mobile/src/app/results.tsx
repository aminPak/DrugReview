import {
  type CabinetItem,
  conditionName,
  displayName,
  type Finding,
  findingTitle,
  type InteractionCheckResult,
  pairLabel,
  type Priority,
  type ProfileCondition,
  quietConditions,
  quietPairs,
  rankFindings,
  viaNote,
} from "@drugreview/core";
import { priorityTone, radius, spacing } from "@drugreview/ui";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText, Badge, Button, Card } from "@/components/ui";
import { api, m } from "@/lib/app";
import { useCabinet } from "@/lib/cabinet";
import { toneColors, useColors } from "@/lib/theme";

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

  const groups = rankFindings(result.findings);
  const count = (p: Priority) => groups.find((g) => g.priority === p)?.findings.length ?? 0;
  const highCount = count("high");
  const cautionCount = count("caution");
  const total = result.findings.length;
  const quiet = quietPairs(state.items.length, result.findings, result.unchecked);
  const quietConds = quietConditions(result, state.items.length, state.conditions.length);
  const hasUnchecked = result.unchecked.length > 0 || result.uncheckedForConditions.length > 0;
  const hasNotices = hasUnchecked || (total > 0 && (quiet.length > 0 || quietConds.length > 0));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {total === 0 ? (
        <View style={styles.summary}>
          <AppText variant="title">{m.results.noneFoundTitle}</AppText>
          <AppText variant="muted">{m.results.noneFoundBody}</AppText>
        </View>
      ) : (
        <View style={styles.summary}>
          {highCount > 0 ? (
            <View
              accessibilityRole="alert"
              style={[styles.banner, { backgroundColor: colors.danger }]}
            >
              <AppText variant="title" color={colors.onDanger} style={styles.bannerTitle}>
                {m.results.highAlertTitle(highCount)}
              </AppText>
              <AppText color={colors.onDanger} style={styles.bold}>
                {m.results.highAlertBody}
              </AppText>
              {cautionCount > 0 && (
                <AppText color={colors.onDanger}>+ {m.results.cautionCount(cautionCount)}</AppText>
              )}
            </View>
          ) : (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: colors.warningSoft,
                  borderColor: colors.warning,
                  borderWidth: 2,
                },
              ]}
            >
              <AppText variant="heading" style={styles.bannerTitle}>
                {m.results.foundTitle(total)}
              </AppText>
            </View>
          )}
          <AppText variant="small">{m.results.rankingNote}</AppText>
        </View>
      )}

      {groups.map((group) => {
        const text = m.results.priority[group.priority];
        return (
          <View key={group.priority} style={styles.group}>
            <AppText
              variant="heading"
              color={toneColors(colors, priorityTone[group.priority]).fg}
              style={styles.groupTitle}
            >
              {text.title} ({group.findings.length})
            </AppText>
            <AppText variant="muted">{text.body}</AppText>
            {group.findings.map((finding, index) => (
              <FindingCard
                key={index}
                finding={finding}
                priority={group.priority}
                snapshot={state}
              />
            ))}
          </View>
        );
      })}

      <Card tone="primary">
        <AppText style={styles.bold}>{m.results.talkToPharmacist}</AppText>
      </Card>

      {hasNotices && (
        <AppText variant="small" style={styles.noticesTitle}>
          {m.results.noticesTitle.toUpperCase()}
        </AppText>
      )}

      {hasUnchecked && (
        <Card tone="neutral">
          <AppText style={styles.bold}>{m.results.uncheckedTitle}</AppText>
          <AppText variant="small">{m.results.uncheckedBody}</AppText>
          {result.uncheckedForConditions.map((i) => (
            <AppText key={`c${i}`} variant="muted">
              • {m.results.uncheckedForConditions(displayName(state.items[i]?.name ?? ""))}
            </AppText>
          ))}
          {result.unchecked.map((pair) => (
            <AppText key={pair.between.join("-")} variant="muted">
              • {pairLabel(pair, state.items)}: {m.results.unchecked[pair.reason]}
            </AppText>
          ))}
        </Card>
      )}

      {total > 0 && quietConds.length > 0 && (
        <Card tone="neutral">
          <AppText style={styles.bold}>{m.results.quietConditionsTitle}</AppText>
          <AppText variant="small">{m.results.quietBody}</AppText>
          {quietConds.map((i) => (
            <AppText key={i} variant="muted">
              • {conditionName(state.conditions[i])}
            </AppText>
          ))}
        </Card>
      )}

      {total > 0 && quiet.length > 0 && (
        <Card tone="neutral">
          <AppText style={styles.bold}>{m.results.quietTitle}</AppText>
          <AppText variant="small">{m.results.quietBody}</AppText>
          {quiet.map((pair) => (
            <AppText key={pair.between.join("-")} variant="muted">
              • {pairLabel(pair, state.items)}
            </AppText>
          ))}
        </Card>
      )}

      <AppText variant="small">{m.disclaimer}</AppText>
      <AppText variant="small">
        {m.results.checkedAt(new Date(result.checkedAt).toLocaleString())}
      </AppText>
    </ScrollView>
  );
}

function FindingCard({
  finding,
  priority,
  snapshot,
}: {
  finding: Finding;
  priority: Priority;
  snapshot: Snapshot;
}) {
  const colors = useColors();
  const high = priority === "high";
  const tone = toneColors(colors, priorityTone[priority]);
  const title = findingTitle(finding, snapshot.items, m, snapshot.conditions);
  const via = viaNote(finding, snapshot.items, m);

  return (
    <Card
      style={{
        borderLeftWidth: 6,
        borderLeftColor: tone.fg,
        ...(high ? { backgroundColor: colors.dangerSoft, borderColor: colors.danger } : null),
      }}
    >
      <View style={styles.tags}>
        <View style={[styles.tag, { backgroundColor: high ? colors.danger : tone.bg }]}>
          <AppText variant="small" color={high ? colors.onDanger : tone.fg} style={styles.tagText}>
            {m.results.priority[priority].tag.toUpperCase()}
          </AppText>
        </View>
        {finding.type !== "same_ingredient" && (
          <Badge label={m.results.inSection(m.sections[finding.section])} tone="neutral" />
        )}
      </View>

      {finding.type === "condition_caution" && (
        <AppText color={colors.primary} style={styles.bold}>
          {m.results.becauseYouHave(conditionName(snapshot.conditions[finding.condition]))}
        </AppText>
      )}

      <AppText variant="heading" style={high ? styles.highTitle : undefined}>
        {title}
      </AppText>

      {finding.type === "same_ingredient" ? (
        <AppText variant={high ? "body" : "muted"}>{m.results.sameIngredientBody}</AppText>
      ) : (
        <>
          <View style={[styles.quote, { borderLeftColor: high ? colors.danger : colors.border }]}>
            <AppText variant={high ? "body" : "muted"}>“{finding.excerpt}”</AppText>
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
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl * 2 },
  summary: { gap: spacing.sm, marginBottom: spacing.xs },
  banner: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  bannerTitle: { fontWeight: "800" },
  group: { gap: spacing.sm },
  groupTitle: { fontWeight: "700" },
  noticesTitle: { fontWeight: "600", letterSpacing: 0.5, marginTop: spacing.sm },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" },
  tag: { borderRadius: radius.pill, paddingHorizontal: spacing.sm + 2, paddingVertical: 3 },
  tagText: { fontWeight: "700", letterSpacing: 0.5 },
  highTitle: { fontWeight: "700" },
  bold: { fontWeight: "600" },
  quote: { borderLeftWidth: 3, paddingLeft: spacing.md },
  link: { fontWeight: "600" },
});

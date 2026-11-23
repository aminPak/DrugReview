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
import { sectionTone } from "@drugreview/ui";
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  HeartPulse,
  Layers,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { m } from "@/lib/app";

export interface CheckSnapshot {
  items: CabinetItem[];
  conditions: ProfileCondition[];
  result: InteractionCheckResult;
}

export function Results({ snapshot, onRetry }: { snapshot: CheckSnapshot; onRetry: () => void }) {
  const { items, conditions, result } = snapshot;

  if (result.status === "unavailable") {
    return (
      <Card className="border-danger/30 bg-danger-soft" role="alert">
        <div className="flex items-center gap-2 text-danger">
          <AlertTriangle className="size-5" />
          <CardTitle>{m.results.unavailableTitle}</CardTitle>
        </div>
        <p className="mt-2 text-sm">{m.results.unavailableBody}</p>
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RefreshCw />
          {m.results.retry}
        </Button>
      </Card>
    );
  }

  const { forConditions, betweenItems } = splitFindings(result.findings);
  const groups = groupByCondition(forConditions, conditions.length);
  const quiet = quietPairs(items.length, result.findings, result.unchecked);
  const quietConds = quietConditions(result, items.length, conditions.length);
  const total = forConditions.length + betweenItems.length;
  const hasUnchecked = result.unchecked.length > 0 || result.uncheckedForConditions.length > 0;

  return (
    <section aria-live="polite" className="space-y-4">
      <div className="flex items-start gap-3">
        {total > 0 ? (
          <AlertTriangle className="mt-1 size-6 shrink-0 text-warning" />
        ) : (
          <CheckCircle2 className="mt-1 size-6 shrink-0 text-muted-foreground" />
        )}
        <div>
          <h2 className="text-xl font-semibold">
            {total > 0 ? m.results.foundTitle(total) : m.results.noneFoundTitle}
          </h2>
          {total === 0 && (
            <p className="mt-1 text-sm text-muted-foreground">{m.results.noneFoundBody}</p>
          )}
        </div>
      </div>

      {groups.length > 0 && (
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <HeartPulse className="size-5 text-primary" />
            {m.results.forConditionsTitle}
          </h3>
          {groups.map((group) => (
            <div key={group.condition} className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">
                {m.results.becauseYouHave(conditionName(conditions[group.condition]))}
              </p>
              {group.findings.map((finding, index) => (
                <FindingCard key={index} finding={finding} snapshot={snapshot} />
              ))}
            </div>
          ))}
        </div>
      )}

      {betweenItems.length > 0 && (
        <div className="space-y-3">
          {groups.length > 0 && (
            <h3 className="text-lg font-semibold">{m.results.betweenItemsTitle}</h3>
          )}
          {betweenItems.map((finding, index) => (
            <FindingCard key={index} finding={finding} snapshot={snapshot} />
          ))}
        </div>
      )}

      {total > 0 && quietConds.length > 0 && (
        <QuietCard
          title={m.results.quietConditionsTitle}
          lines={quietConds.map((i) => conditionName(conditions[i]))}
        />
      )}
      {total > 0 && quiet.length > 0 && (
        <QuietCard
          title={m.results.quietTitle}
          lines={quiet.map((pair) => pairLabel(pair, items))}
        />
      )}

      {hasUnchecked && (
        <Card className="bg-surface-muted shadow-none">
          <div className="flex items-center gap-2">
            <CircleHelp className="size-4 text-muted-foreground" />
            <CardTitle>{m.results.uncheckedTitle}</CardTitle>
          </div>
          <CardDescription className="mt-1">{m.results.uncheckedBody}</CardDescription>
          <ul className="mt-3 space-y-1.5 text-sm">
            {result.uncheckedForConditions.map((i) => (
              <li key={`c${i}`}>
                {m.results.uncheckedForConditions(displayName(items[i]?.name ?? ""))}
              </li>
            ))}
            {result.unchecked.map((pair) => (
              <li key={pair.between.join("-")}>
                <span className="font-medium">{pairLabel(pair, items)}</span>
                <span className="text-muted-foreground"> · {m.results.unchecked[pair.reason]}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="border-primary/30 bg-primary-soft shadow-none">
        <p className="text-sm font-medium">{m.results.talkToPharmacist}</p>
      </Card>

      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer font-medium">{m.results.sourcesTitle}</summary>
        <ul className="mt-2 space-y-1 ps-4">
          {result.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer" className="hover:underline">
                {source.name}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2">{m.results.checkedAt(new Date(result.checkedAt).toLocaleString())}</p>
      </details>
    </section>
  );
}

function FindingCard({ finding, snapshot }: { finding: Finding; snapshot: CheckSnapshot }) {
  const title = findingTitle(finding, snapshot.items, m, snapshot.conditions);

  if (finding.type === "same_ingredient") {
    return (
      <Card className="border-danger/30">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-danger" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription className="mt-2">{m.results.sameIngredientBody}</CardDescription>
      </Card>
    );
  }

  const via = viaNote(finding, snapshot.items, m);
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        <Badge tone={sectionTone[finding.section]}>
          {m.results.inSection(m.sections[finding.section])}
        </Badge>
      </div>
      <blockquote className="mt-3 border-s-4 border-border ps-4 text-sm leading-6 text-muted-foreground">
        “{finding.excerpt}”
      </blockquote>
      {via && <p className="mt-2 text-xs text-muted-foreground">{via}</p>}
      <a
        href={finding.source.url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        {m.results.openLabel}
        <ExternalLink className="size-3.5" />
      </a>
    </Card>
  );
}

function QuietCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <Card className="bg-surface-muted shadow-none">
      <CardTitle>{title}</CardTitle>
      <CardDescription className="mt-1">{m.results.quietBody}</CardDescription>
      <ul className="mt-3 space-y-1.5 text-sm font-medium">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </Card>
  );
}

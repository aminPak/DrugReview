import {
  type CabinetItem,
  findingTitle,
  type InteractionCheckResult,
  pairLabel,
  quietPairs,
  sortFindings,
} from "@drugreview/core";
import { sectionTone } from "@drugreview/ui";
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  Layers,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { m } from "@/lib/app";

export function Results({
  items,
  result,
  onRetry,
}: {
  items: CabinetItem[];
  result: InteractionCheckResult;
  onRetry: () => void;
}) {
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

  const findings = sortFindings(result.findings);
  const quiet = quietPairs(items.length, result.findings, result.unchecked);

  return (
    <section aria-live="polite" className="space-y-4">
      <div className="flex items-start gap-3">
        {findings.length > 0 ? (
          <AlertTriangle className="mt-1 size-6 shrink-0 text-warning" />
        ) : (
          <CheckCircle2 className="mt-1 size-6 shrink-0 text-muted-foreground" />
        )}
        <div>
          <h2 className="text-xl font-semibold">
            {findings.length > 0 ? m.results.foundTitle(findings.length) : m.results.noneFoundTitle}
          </h2>
          {findings.length === 0 && (
            <p className="mt-1 text-sm text-muted-foreground">{m.results.noneFoundBody}</p>
          )}
        </div>
      </div>

      {findings.map((finding, index) =>
        finding.type === "same_ingredient" ? (
          <Card key={index} className="border-danger/30">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-danger" />
              <CardTitle>{findingTitle(finding, items, m)}</CardTitle>
            </div>
            <CardDescription className="mt-2">{m.results.sameIngredientBody}</CardDescription>
          </Card>
        ) : (
          <Card key={index}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{findingTitle(finding, items, m)}</CardTitle>
              <Badge tone={sectionTone[finding.section]}>
                {m.results.inSection(m.sections[finding.section])}
              </Badge>
            </div>
            <blockquote className="mt-3 border-s-4 border-border ps-4 text-sm leading-6 text-muted-foreground">
              “{finding.excerpt}”
            </blockquote>
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
        ),
      )}

      {findings.length > 0 && quiet.length > 0 && (
        <Card className="bg-surface-muted shadow-none">
          <CardTitle>{m.results.quietTitle}</CardTitle>
          <CardDescription className="mt-1">{m.results.quietBody}</CardDescription>
          <ul className="mt-3 space-y-1.5 text-sm font-medium">
            {quiet.map((pair) => (
              <li key={pair.between.join("-")}>{pairLabel(pair, items)}</li>
            ))}
          </ul>
        </Card>
      )}

      {result.unchecked.length > 0 && (
        <Card className="bg-surface-muted shadow-none">
          <div className="flex items-center gap-2">
            <CircleHelp className="size-4 text-muted-foreground" />
            <CardTitle>{m.results.uncheckedTitle}</CardTitle>
          </div>
          <CardDescription className="mt-1">{m.results.uncheckedBody}</CardDescription>
          <ul className="mt-3 space-y-1.5 text-sm">
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

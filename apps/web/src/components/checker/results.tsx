import {
  type CabinetItem,
  checkSummaryLine,
  conditionName,
  displayName,
  type Finding,
  findingTitle,
  type InteractionCheckResult,
  itemConditionLabel,
  pairLabel,
  type Priority,
  type ProfileCondition,
  quietConditions,
  quietPairs,
  rankFindings,
  ruleReviewLine,
  viaNote,
} from "@drugreview/core";
import {
  AlertTriangle,
  BookCheck,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  HeartPulse,
  Info,
  Layers,
  OctagonAlert,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { m } from "@/lib/app";
import { cn } from "@/lib/utils";

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

  const groups = rankFindings(result.findings);
  const count = (p: Priority) => groups.find((g) => g.priority === p)?.findings.length ?? 0;
  const highCount = count("high");
  const cautionCount = count("caution");
  const total = result.findings.length;
  const quiet = quietPairs(items.length, result.findings, result.unchecked);
  const quietConds = quietConditions(result, items.length, conditions.length);
  const hasUnchecked = result.unchecked.length > 0 || result.uncheckedForConditions.length > 0;
  const hasNotices = hasUnchecked || (total > 0 && (quiet.length > 0 || quietConds.length > 0));

  return (
    <section aria-live="polite" className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {checkSummaryLine(result, items.length, conditions.length, m)}
      </p>
      <Summary highCount={highCount} cautionCount={cautionCount} total={total} />

      {groups.map((group) => (
        <PriorityGroup
          key={group.priority}
          priority={group.priority}
          findings={group.findings}
          snapshot={snapshot}
        />
      ))}

      <Card className="border-primary/30 bg-primary-soft shadow-none">
        <div className="flex items-start gap-3">
          <Stethoscope className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm font-semibold">{m.results.talkToPharmacist}</p>
        </div>
      </Card>

      {hasNotices && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Info className="size-4" />
            {m.results.noticesTitle}
          </h3>

          {hasUnchecked && (
            <NoticeCard
              icon={<CircleHelp className="size-4 text-muted-foreground" />}
              title={m.results.uncheckedTitle}
              body={m.results.uncheckedBody}
            >
              {result.uncheckedForConditions.map((i) => (
                <li key={`c${i}`}>
                  {m.results.uncheckedForConditions(displayName(items[i]?.name ?? ""))}
                </li>
              ))}
              {result.unchecked.map((pair) => (
                <li key={pair.between.join("-")}>
                  <span className="font-medium">{pairLabel(pair, items)}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {m.results.unchecked[pair.reason]}
                  </span>
                </li>
              ))}
            </NoticeCard>
          )}
          {total > 0 && quietConds.length > 0 && (
            <NoticeCard title={m.results.quietConditionsTitle} body={m.results.quietConditionsBody}>
              {quietConds.map((pair) => (
                <li key={`${pair.item}-${pair.condition}`} className="font-medium">
                  {itemConditionLabel(pair, items, conditions)}
                </li>
              ))}
            </NoticeCard>
          )}
          {total > 0 && quiet.length > 0 && (
            <NoticeCard title={m.results.quietTitle} body={m.results.quietBody}>
              {quiet.map((pair) => (
                <li key={pair.between.join("-")} className="font-medium">
                  {pairLabel(pair, items)}
                </li>
              ))}
            </NoticeCard>
          )}
        </div>
      )}

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

/** The headline. Serious warnings get a solid, high-contrast alert; cautions a softer one. */
function Summary({
  highCount,
  cautionCount,
  total,
}: {
  highCount: number;
  cautionCount: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-1 size-6 shrink-0 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold">{m.results.noneFoundTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{m.results.noneFoundBody}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {highCount > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl bg-danger p-5 text-danger-foreground shadow-md"
        >
          <OctagonAlert className="mt-0.5 size-7 shrink-0" />
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold">{m.results.highAlertTitle(highCount)}</h2>
            <p className="font-semibold">{m.results.highAlertBody}</p>
            {cautionCount > 0 && (
              <p className="text-sm font-medium opacity-90">
                + {m.results.cautionCount(cautionCount)}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border-2 border-warning/50 bg-warning-soft p-5">
          <AlertTriangle className="mt-0.5 size-6 shrink-0 text-warning" />
          <h2 className="text-xl font-bold">{m.results.foundTitle(total)}</h2>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{m.results.rankingNote}</p>
    </div>
  );
}

const groupStyles = {
  high: { heading: "text-danger", icon: OctagonAlert },
  caution: { heading: "text-warning", icon: AlertTriangle },
} as const;

function PriorityGroup({
  priority,
  findings,
  snapshot,
}: {
  priority: Priority;
  findings: Finding[];
  snapshot: CheckSnapshot;
}) {
  const text = m.results.priority[priority];
  const { heading, icon: Icon } = groupStyles[priority];
  return (
    <div className="space-y-3">
      <div>
        <h3 className={cn("flex items-center gap-2 text-lg font-bold", heading)}>
          <Icon className="size-5" />
          {text.title}
          <span className="text-base font-semibold">({findings.length})</span>
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{text.body}</p>
      </div>
      {findings.map((finding, index) => (
        <FindingCard key={index} finding={finding} priority={priority} snapshot={snapshot} />
      ))}
    </div>
  );
}

function FindingCard({
  finding,
  priority,
  snapshot,
}: {
  finding: Finding;
  priority: Priority;
  snapshot: CheckSnapshot;
}) {
  const high = priority === "high";
  const title = findingTitle(finding, snapshot.items, m, snapshot.conditions);
  const via = viaNote(finding, snapshot.items, m);

  return (
    <Card
      className={cn(
        "border-s-[6px]",
        high ? "border-danger/40 border-s-danger bg-danger-soft" : "border-s-warning",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
            high ? "bg-danger text-danger-foreground" : "bg-warning-soft text-warning",
          )}
        >
          {m.results.priority[priority].tag}
        </span>
        {finding.type === "reviewed_rule" ? (
          <Badge>
            <BookCheck className="size-3.5" />
            {m.results.reviewedRuleTag}
          </Badge>
        ) : (
          finding.type !== "same_ingredient" && (
            <Badge>{m.results.inSection(m.sections[finding.section])}</Badge>
          )
        )}
      </div>

      {(finding.type === "condition_caution" || finding.type === "reviewed_rule") && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary">
          <HeartPulse className="size-4" />
          {m.results.becauseYouHave(conditionName(snapshot.conditions[finding.condition]))}
        </p>
      )}

      <CardTitle className={cn("mt-2 flex items-start gap-2", high && "text-lg font-bold")}>
        {finding.type === "same_ingredient" && <Layers className="mt-1 size-4 shrink-0" />}
        {title}
      </CardTitle>

      {finding.type === "same_ingredient" ? (
        <p className={cn("mt-2 text-sm", high ? "font-medium" : "text-muted-foreground")}>
          {m.results.sameIngredientBody}
        </p>
      ) : finding.type === "reviewed_rule" ? (
        <>
          {/* Not label text, so not shown as a quotation. */}
          <p className={cn("mt-3 text-sm leading-6", high ? "font-medium" : "text-foreground")}>
            {finding.statement}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {m.results.ruleAppliesTo(finding.appliesTo)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{m.results.reviewedRuleBody}</p>
          <p className="mt-1 text-xs text-muted-foreground">{ruleReviewLine(finding, m)}</p>
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground">
              {m.results.ruleSourcesTitle}
            </p>
            <ul className="mt-1 space-y-1">
              {finding.citations.map((citation) => (
                <li key={citation.url}>
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-start gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    {citation.name}
                    <ExternalLink className="mt-1 size-3.5 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          <blockquote
            className={cn(
              "mt-3 border-s-4 ps-4 text-sm leading-6",
              high ? "border-danger/40 text-foreground" : "border-border text-muted-foreground",
            )}
          >
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
        </>
      )}
    </Card>
  );
}

function NoticeCard({
  icon,
  title,
  body,
  children,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <Card className="bg-surface-muted p-4 shadow-none">
      <div className="flex items-center gap-2">
        {icon}
        <CardTitle className="text-sm">{title}</CardTitle>
      </div>
      <CardDescription className="mt-1 text-xs">{body}</CardDescription>
      <ul className="mt-2 space-y-1 text-sm">{children}</ul>
    </Card>
  );
}

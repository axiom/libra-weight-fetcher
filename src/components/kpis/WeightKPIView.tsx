import { Show, type ParentProps } from "solid-js";

export type KPISentiment = "good" | "bad" | "fair" | "neutral";

interface Props {
  label: string;
  value: string;
  unit?: string;
  icon: string;
  sentiment?: KPISentiment;
  badgeText?: string;
  meta?: string | number | null;
  class?: string;
}

function sentimentTextClass(sentiment: KPISentiment | undefined): string {
  if (sentiment === "bad") return "text-[var(--color-danger)]";
  if (sentiment === "good") return "text-[var(--color-success)]";
  if (sentiment === "fair") return "text-[var(--color-warning)]";
  return "text-[var(--color-text)]";
}

function sentimentBadgeClass(sentiment: KPISentiment | undefined): string {
  if (sentiment === "bad")
    return "bg-[var(--color-danger-subtle)] text-[var(--color-danger)]";
  if (sentiment === "good")
    return "bg-[var(--color-success-subtle)] text-[var(--color-success)]";
  if (sentiment === "fair")
    return "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]";
  return "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]";
}

function SentimentValue(props: ParentProps & { sentiment?: KPISentiment }) {
  return (
    <span class={`font-semibold ${sentimentTextClass(props.sentiment)}`}>
      {props.children}
    </span>
  );
}

function Badge(props: ParentProps & { sentiment?: KPISentiment }) {
  return (
    <span
      class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sentimentBadgeClass(props.sentiment)}`}
    >
      {props.children}
    </span>
  );
}

export default function WeightKPIView(props: Props) {
  return (
    <div
      class={`group relative overflow-hidden rounded-xl p-4 border border-[var(--color-border)] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 bg-[var(--color-surface)] ${props.class ?? ""}`}
    >
      <div
        class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top right, color-mix(in srgb, var(--color-accent) 15%, transparent), transparent 50%)",
        }}
      />

      <div class="relative z-10">
        <div class="flex items-start justify-between gap-3 mb-3">
          <span class="text-sm font-medium text-[var(--color-text-muted)]">
            {props.label}
          </span>
          <Show when={props.badgeText}>
            <Badge sentiment={props.sentiment}>{props.badgeText}</Badge>
          </Show>
        </div>

        <div class="flex items-baseline gap-1">
          <span class="text-4xl font-semibold font-mono-nums tracking-tight">
            <SentimentValue sentiment={props.sentiment}>
              {props.value}
            </SentimentValue>
          </span>
          <Show when={props.unit}>
            <span class="text-lg text-[var(--color-text-muted)]">
              {props.unit}
            </span>
          </Show>
        </div>

        <Show when={props.meta}>
          <div class="mt-2 text-xs text-[var(--color-text-muted)]">
            {props.meta}
          </div>
        </Show>
      </div>

      <div class="absolute -bottom-2 -right-2 text-8xl opacity-[0.06] select-none pointer-events-none leading-none font-mono-nums">
        {props.icon}
      </div>
    </div>
  );
}

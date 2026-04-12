import type { ParentProps } from "solid-js";
import { useTheme } from "../../context/ThemeContext";

export type KPISentiment = "good" | "bad" | "fair" | "neutral";

interface Props {
  label: string;
  value: string;
  unit?: string;
  icon: string;
  sentiment?: KPISentiment;
  badgeText?: string;
  meta?: string | null;
  class?: string;
}

function SentimentValue(props: ParentProps & { sentiment?: KPISentiment }) {
  const { resolvedTheme } = useTheme();
  
  const colorClass = () => {
    const sentiment = props.sentiment;
    if (sentiment === "bad") {
      return resolvedTheme() === "dark" ? "text-red-400" : "text-red-600";
    }
    if (sentiment === "good") {
      return resolvedTheme() === "dark" ? "text-emerald-400" : "text-emerald-600";
    }
    if (sentiment === "fair") {
      return resolvedTheme() === "dark" ? "text-amber-400" : "text-amber-600";
    }
    return resolvedTheme() === "dark" ? "text-zinc-100" : "text-zinc-900";
  };

  return <span class={`font-semibold ${colorClass()}`}>{props.children}</span>;
}

function Badge(props: ParentProps & { sentiment?: KPISentiment }) {
  const { resolvedTheme } = useTheme();
  
  const bgClass = () => {
    const sentiment = props.sentiment;
    if (sentiment === "bad") {
      return resolvedTheme() === "dark" ? "bg-red-900/40 text-red-300" : "bg-red-100 text-red-700";
    }
    if (sentiment === "good") {
      return resolvedTheme() === "dark" ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-100 text-emerald-700";
    }
    if (sentiment === "fair") {
      return resolvedTheme() === "dark" ? "bg-amber-900/40 text-amber-300" : "bg-amber-100 text-amber-700";
    }
    return resolvedTheme() === "dark" ? "bg-zinc-700 text-zinc-300" : "bg-zinc-200 text-zinc-700";
  };

  return (
    <span class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${bgClass()}`}>
      {props.children}
    </span>
  );
}

export default function WeightKPIView(props: Props) {
  const { resolvedTheme } = useTheme();

  return (
    <div
      class={`group relative overflow-hidden rounded-xl p-4 border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        resolvedTheme() === "dark"
          ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
          : "bg-white border-zinc-200 hover:border-zinc-300"
      } ${props.class ?? ""}`}
    >
      <div
        class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: resolvedTheme() === "dark"
            ? "radial-gradient(circle at top right, rgba(59, 130, 246, 0.15), transparent 50%)"
            : "radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 50%)",
        }}
      />

      <div class="relative z-10">
        <div class="flex items-start justify-between gap-3 mb-3">
          <span class="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {props.label}
          </span>
          <Show when={props.badgeText}>
            <Badge sentiment={props.sentiment}>{props.badgeText}</Badge>
          </Show>
        </div>

        <div class="flex items-baseline gap-1">
          <span class="text-4xl font-semibold font-mono-nums tracking-tight">
            <SentimentValue sentiment={props.sentiment}>{props.value}</SentimentValue>
          </span>
          <Show when={props.unit}>
            <span class="text-lg text-zinc-400 dark:text-zinc-500">
              {props.unit}
            </span>
          </Show>
        </div>

        <Show when={props.meta}>
          <div class="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
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

import { Show } from "solid-js";
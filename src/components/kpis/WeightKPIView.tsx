import type { ParentProps } from "solid-js";

export type KPISentiment = "good" | "bad" | "neutral";

interface Props {
  label: string;
  value: string;
  icon: string;
  sentiment?: KPISentiment;
  badgeText?: string;
  meta?: string | null;
  class?: string;
}

function BadValue(props: ParentProps) {
  return <span class="text-red-500 dark:text-red-400">{props.children}</span>;
}

function GoodValue(props: ParentProps) {
  return (
    <span class="text-green-600 dark:text-green-400">{props.children}</span>
  );
}

function NeutralValue(props: ParentProps) {
  return <span class="text-gray-900 dark:text-gray-100">{props.children}</span>;
}

export default function WeightKPIView(props: Props) {
  const badgeClass = () => {
    switch (props.sentiment) {
      case "good":
        return "text-green-700 bg-green-100";
      case "bad":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-200";
    }
  };

  return (
    <div
      class={`relative overflow-hidden rounded-2xl p-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-orange-100/80 to-amber-100/80 dark:from-orange-900/30 dark:to-amber-900/30 min-w-[min-content] ${props.class ?? ""}`}
    >
      <div class="flex items-start justify-between gap-3 mb-2">
        <div class="text-sm text-gray-600 dark:text-gray-300">
          {props.label}
        </div>
        <div>
          {props.badgeText ? (
            <span
              class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass()}`}
            >
              {props.badgeText}
            </span>
          ) : null}
        </div>
      </div>

      <div class="text-5xl font-semibold leading-tight relative z-10 whitespace-nowrap">
        {props.sentiment === "bad" ? (
          <BadValue>{props.value}</BadValue>
        ) : props.sentiment === "good" ? (
          <GoodValue>{props.value}</GoodValue>
        ) : (
          <NeutralValue>{props.value}</NeutralValue>
        )}
      </div>
      <div class="absolute -bottom-4 -right-4 text-9xl opacity-15 select-none pointer-events-none leading-none">
        {props.icon}
      </div>

      {props.meta ? (
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {props.meta}
        </div>
      ) : null}
    </div>
  );
}

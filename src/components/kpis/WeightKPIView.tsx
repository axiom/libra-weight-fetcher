import type { JSX } from "solid-js";

export interface KPIBadge {
  text: string;
  className: string;
}

export type KPISentiment = "good" | "bad" | "neutral";

export interface KPIViewSlots {
  icon?: (args: { icon: string }) => JSX.Element;
  label?: (args: { label: string }) => JSX.Element;
  value?: (args: {
    value: string;
    sentiment: KPISentiment;
    icon: string;
  }) => JSX.Element;
  badge?: (args: { badge: KPIBadge | null }) => JSX.Element;
  meta?: (args: { meta: string | null }) => JSX.Element;
}

interface Props {
  label: string;
  value: string;
  icon: string;
  sentiment?: KPISentiment;
  badge: KPIBadge | null;
  meta: string | null;
  slots?: KPIViewSlots;
  class?: string;
}

function BadText({ children }) {
  return <span class="text-red-500">{children}</span>;
}

export default function WeightKPIView(props: Props) {
  return (
    <div
      class={`relative overflow-hidden rounded-2xl p-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-orange-100/80 to-amber-100/80 dark:from-orange-900/30 dark:to-amber-900/30 min-w-[min-content] ${props.class ?? ""}`}
    >
      <div class="flex items-start justify-between gap-3 mb-2">
        <div class="text-sm text-gray-600 dark:text-gray-300">
          {props.slots?.label
            ? props.slots.label({ label: props.label })
            : props.label}
        </div>
        <div>
          {props.slots?.badge ? (
            props.slots.badge({ badge: props.badge })
          ) : props.badge ? (
            <span
              class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${props.badge.className}`}
            >
              {props.badge.text}
            </span>
          ) : null}
        </div>
      </div>

      <div class="text-5xl font-semibold text-gray-900 dark:text-gray-100 leading-tight relative z-10 whitespace-nowrap">
        {
          props.slots?.value ? (
            props.slots.value({
              value: props.value,
              sentiment: props.sentiment ?? "neutral",
              icon: props.icon,
            })
          ) : props.sentiment === "bad" ? (
            <BadText>{props.value}</BadText>
          ) : (
            <span>{props.value}</span>
          )
          // <span
          //   class={
          //     props.sentiment === "bad"
          //       ? "text-red-500 dark:text-red-400"
          //       : props.sentiment === "good"
          //         ? "text-green-600 dark:text-green-400"
          //         : "text-gray-900 dark:text-gray-100"
          //   }
          // >
          //   {props.value}
          // </span>
        }
      </div>
      <div class="absolute -bottom-4 -right-4 text-9xl opacity-15 select-none pointer-events-none leading-none">
        {props.icon}
      </div>

      {props.slots?.meta ? (
        <div class="mt-2">{props.slots.meta({ meta: props.meta })}</div>
      ) : props.meta ? (
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {props.meta}
        </div>
      ) : null}
    </div>
  );
}

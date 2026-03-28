import type {
  KPIResult,
  KPIType,
  StreakResult,
  ValueAtDate,
} from "./weightKpi.logic";

export interface KPIBadge {
  text: string;
  className: string;
}

export interface KPIViewModel {
  label: string;
  value: string;
  valueClassName: string;
  icon: string;
  badge: KPIBadge | null;
  meta: string | null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function asValueAtDate(value: KPIResult): ValueAtDate | null {
  if (!value || typeof value !== "object") return null;
  if ("value" in value && "date" in value) return value;
  return null;
}

function asStreak(value: KPIResult): StreakResult | null {
  if (!value || typeof value !== "object") return null;
  if ("days" in value && "endDate" in value) return value;
  return null;
}

function asNumber(value: KPIResult): number | null {
  return typeof value === "number" ? value : null;
}

function formatValue(type: KPIType, value: KPIResult): string {
  if (value === null) return "N/A";

  switch (type) {
    case "lossStreak":
    case "gainStreak":
      return `${asNumber(value) ?? 0} days`;
    case "longestLossStreak":
    case "longestGainStreak": {
      const streak = asStreak(value);
      return streak ? `${streak.days} days` : "N/A";
    }
    case "current":
    case "average":
      return `${(asNumber(value) ?? 0).toFixed(1)} kg`;
    case "min":
    case "max": {
      const withDate = asValueAtDate(value);
      return withDate ? `${withDate.value.toFixed(1)} kg` : "N/A";
    }
    case "change": {
      const numeric = asNumber(value) ?? 0;
      const prefix = numeric > 0 ? "+" : "";
      return `${prefix}${numeric.toFixed(1)} kg`;
    }
    case "range":
      return `${(asNumber(value) ?? 0).toFixed(1)} kg`;
    default:
      return String(value);
  }
}

function formatLabel(type: KPIType, label: string, value: KPIResult): string {
  if (type === "min" || type === "max") {
    const withDate = asValueAtDate(value);
    if (withDate) return `${label} (${formatDate(withDate.date)})`;
  }

  if (type === "longestLossStreak" || type === "longestGainStreak") {
    const streak = asStreak(value);
    if (streak) return `${label} (${formatDate(streak.endDate)})`;
  }

  return label;
}

function getValueClassName(type: KPIType, value: KPIResult): string {
  if (value === null) return "text-gray-400";

  switch (type) {
    case "lossStreak":
      return (asNumber(value) ?? 0) > 0 ? "text-green-600" : "text-gray-500";
    case "longestLossStreak": {
      const streak = asStreak(value);
      return streak && streak.days > 0 ? "text-green-600" : "text-gray-500";
    }
    case "gainStreak":
      return (asNumber(value) ?? 0) > 0 ? "text-red-500" : "text-gray-500";
    case "longestGainStreak": {
      const streak = asStreak(value);
      return streak && streak.days > 0 ? "text-red-500" : "text-gray-500";
    }
    case "min":
      return "text-green-600";
    case "max":
      return "text-red-500";
    case "change":
      return (asNumber(value) ?? 0) < 0
        ? "text-green-600"
        : (asNumber(value) ?? 0) > 0
          ? "text-red-500"
          : "text-gray-500";
    case "range":
      return "text-gray-700 dark:text-gray-300";
    default:
      return "text-gray-900 dark:text-gray-100";
  }
}

function getIcon(type: KPIType, value: KPIResult): string {
  if (value === null) return "➖";

  switch (type) {
    case "lossStreak":
      return (asNumber(value) ?? 0) > 0 ? "📉" : "➖";
    case "longestLossStreak":
      return "🏆";
    case "gainStreak":
      return (asNumber(value) ?? 0) > 0 ? "📈" : "➖";
    case "longestGainStreak":
      return "😬";
    case "change":
      return (asNumber(value) ?? 0) < 0
        ? "📉"
        : (asNumber(value) ?? 0) > 0
          ? "📈"
          : "➖";
    case "min":
      return "⬇️";
    case "max":
      return "⬆️";
    case "range":
      return "↔️";
    case "average":
      return "📊";
    case "current":
      return "⚖️";
    default:
      return "➖";
  }
}

function getBadge(type: KPIType, value: KPIResult): KPIBadge | null {
  if (value === null)
    return { text: "No data", className: "text-gray-500 bg-gray-200/70" };

  if (type === "change") {
    const numeric = asNumber(value) ?? 0;
    if (numeric < 0)
      return { text: "Cutting", className: "text-green-700 bg-green-100" };
    if (numeric > 0)
      return { text: "Gaining", className: "text-red-700 bg-red-100" };
    return { text: "Stable", className: "text-gray-700 bg-gray-200" };
  }

  if (type === "lossStreak" || type === "gainStreak") {
    return (asNumber(value) ?? 0) > 0
      ? { text: "Active", className: "text-gray-700 bg-gray-200" }
      : { text: "Idle", className: "text-gray-500 bg-gray-100" };
  }

  if (type === "longestLossStreak" || type === "longestGainStreak") {
    const streak = asStreak(value);
    if (!streak || streak.days === 0) {
      return { text: "No streak", className: "text-gray-500 bg-gray-100" };
    }
    return { text: "Record", className: "text-amber-800 bg-amber-100" };
  }

  return null;
}

function getMeta(type: KPIType, days?: number): string | null {
  if ((type === "change" || type === "range" || type === "average") && days) {
    return `${days}-day window`;
  }
  return null;
}

export function toKPIViewModel(args: {
  type: KPIType;
  label: string;
  value: KPIResult;
  days?: number;
}): KPIViewModel {
  return {
    label: formatLabel(args.type, args.label, args.value),
    value: formatValue(args.type, args.value),
    valueClassName: getValueClassName(args.type, args.value),
    icon: getIcon(args.type, args.value),
    badge: getBadge(args.type, args.value),
    meta: getMeta(args.type, args.days),
  };
}

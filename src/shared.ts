import { isDarkMode } from "./context/ThemeContext";

export interface WeightEntry {
  date: string;
  weight: number;
  trend: number;
}

export const DAY_MS = 86_400_000;

export const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

export const updateTrend = (
  latestWeight: [string, number, number],
  isFalling: boolean,
) => {
  const currentWeight = Math.round(latestWeight[2]).toString();
  const currentTrendDom = document.getElementById("trend");
  if (currentTrendDom) {
    currentTrendDom.innerText = currentWeight;
  }
  const trendToken = isFalling ? "↓" : "↑";
  const emoji = isFalling ? "📉" : "📈";
  document.title = `${emoji} ${trendToken} ${currentWeight}kg`;
};

export const getDarkMode = isDarkMode;

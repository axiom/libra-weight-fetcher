export interface WeightEntry {
  date: string;
  weight: number;
  trend: number;
}

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
  const trendToken = isFalling ? "📉" : "📈";
  document.title = `🐼 ${trendToken} ${currentWeight}kg ${trendToken}`;
};

export const getDarkMode = () => {
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
};

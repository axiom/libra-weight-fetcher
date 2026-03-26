export interface WeightEntry {
  date: string;
  weight: number;
  trend: number;
}

export const fetchWeights = async (url: string = "weights.json"): Promise<WeightEntry[]> => {
  return await fetch(url).then((res) => res.json());
};

export const updateTrend = (latestWeight: [string, number, number], isFalling: boolean) => {
  const currentWeight = Math.round(latestWeight[2]).toString();
  const currentTrendDom = document.getElementById("trend");
  if (currentTrendDom) {
    currentTrendDom.innerText = currentWeight;
  }
  const trendToken = isFalling ? "📉" : "📈";
  document.title = `🐼 ${trendToken} ${currentWeight}kg ${trendToken}`;
};

export const getDarkMode = () => {
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
};

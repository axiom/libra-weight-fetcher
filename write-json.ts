import { Database } from "bun:sqlite";

const dbFile = "weights.db";

class Weight {
  date: string;
  epoch: number;
  weight: number;
  weight_trend: number;
}

interface WeightValue {
  date: string;
  weight: number;
  trend: number;
}

try {
  using db = new Database(dbFile);
  using query = db.query("select * from weights order by epoch;").as(Weight);

  const weights: Array<WeightValue> = [];

  for (const weight of query.all()) {
    weights.push({
      date: weight.date,
      weight: weight.weight,
      trend: weight.weight_trend,
    });
  }

  Bun.write("dist/weights.json", JSON.stringify(weights, null, 2));
} catch (error) {
  console.error("Error occurred:", error);
}

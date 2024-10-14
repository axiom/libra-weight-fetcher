import { Database } from "bun:sqlite";

// API URL and token from environment variables
const apiUrl = "https://api.libra-app.eu"; // Replace with actual API URL
const apiToken = process.env.API_TOKEN;
const dbFile = "weights.db";

const weightUrl = (since: Date | undefined): string => {
  const search =
    since != undefined ? `?modified_since=${since.toISOString()}` : "";
  return `${apiUrl}/values/weight${search}`;
};

if (!apiToken) {
  console.error("API_TOKEN is not defined.");
  process.exit(1);
}

type WeightValue = {
  date: string;
  weight: number;
  weight_trend: number;
  body_fat: number;
  body_fat_trend: number;
  log?: string;
};

type WeightResponse = {
  values: Array<WeightValue>;
};

const fetchData = async (since: Date): Promise<WeightResponse> => {
  // Define headers for the request
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${apiToken}`);

  console.log("Fetching CSV data from API...");

  const url = weightUrl(since);
  console.log(url);
  const response = await fetch(weightUrl(since), { headers });

  if (!response.ok) {
    console.error("Failed to fetch data from API:", response.statusText);
    process.exit(1);
  }

  return response.json() as Promise<WeightResponse>;
};

class Since {
  epoch: number;

  get date() {
    return new Date(this.epoch);
  }
}

try {
  const db = new Database(dbFile);

  // Create the table if it doesn't exist
  db.run(`
    create table if not exists weights (
      date text not null primary key,
      epoch integer not null,
      weight real not null,
      weight_trend real,
      body_fat real,
      body_fat_trend real
    );
  `);

  const query = db.query(`select max(epoch) as epoch from weights;`).as(Since);
  const since = query.get().date;

  const data = await fetchData(since);

  console.log(data);

  for (const weight of data.values) {
    console.table(weight);
  }

  // Insert rows into the database
  const insertQuery = `
    INSERT OR REPLACE INTO weights (date, epoch, weight, weight_trend, body_fat, body_fat_trend)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const stmt = db.prepare(insertQuery);

  for (const weight of data.values) {
    const t = new Date(weight.date);

    stmt.run(
      t.toISOString(),
      t.valueOf(),
      weight.weight,
      weight.weight_trend,
      weight.body_fat,
      weight.body_fat_trend,
    );
  }

  console.log("Data successfully inserted into SQLite database.");

  // Commit and close the database
  db.close();
} catch (error) {
  console.error("Error occurred:", error);
  process.exit(1);
}

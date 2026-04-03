import type { Meta, StoryObj } from "storybook-solidjs-vite";
import type { WeightEntry } from "../../shared";
import WeightChangeKPI from "./WeightChangeKPI";

const meta: Meta<typeof WeightChangeKPI> = {
  component: WeightChangeKPI,
  decorators: [
    (Story) => (
      <div style="width: min(33ch, 100%);">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WeightChangeKPI>;

const losingWeights: WeightEntry[] = [
  { date: "2024-01-01", weight: 90, trend: 90 },
  { date: "2024-01-02", weight: 89.5, trend: 89.5 },
  { date: "2024-01-03", weight: 89, trend: 89 },
  { date: "2024-01-04", weight: 88.5, trend: 88.5 },
  { date: "2024-01-05", weight: 88, trend: 88 },
];

const gainingWeights: WeightEntry[] = losingWeights.map((w) => ({
  ...w,
  weight: w.weight + 5,
}));

const stableWeights: WeightEntry[] = Array(30)
  .fill(null)
  .map((_, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, "0")}`,
    weight: 80 + Math.random() * 0.2 - 0.1,
    trend: 80,
  }));

export const Cutting: Story = {
  args: {
    weights: losingWeights,
    days: 30,
    label: "30-Day Change",
  },
};

export const Gaining: Story = {
  args: {
    weights: gainingWeights,
    days: 30,
    label: "30-Day Change",
  },
};

export const Stable: Story = {
  args: {
    weights: stableWeights,
    days: 30,
    label: "30-Day Change",
  },
};

export const NoData: Story = {
  args: {
    weights: [],
    days: 30,
    label: "30-Day Change",
  },
};

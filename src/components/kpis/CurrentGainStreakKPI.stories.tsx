import type { Meta, StoryObj } from "storybook-solidjs-vite";
import type { WeightEntry } from "../../shared";
import CurrentGainStreakKPI from "./CurrentGainStreakKPI";

const meta: Meta<typeof CurrentGainStreakKPI> = {
  component: CurrentGainStreakKPI,
  decorators: [
    (Story) => (
      <div style="width: min(33ch, 100%);">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CurrentGainStreakKPI>;

const mockWeights: WeightEntry[] = [
  { date: "2024-01-01", weight: 80, trend: 80 },
  { date: "2024-01-02", weight: 80.5, trend: 80.5 },
  { date: "2024-01-03", weight: 81, trend: 81 },
  { date: "2024-01-04", weight: 81.5, trend: 81.5 },
  { date: "2024-01-05", weight: 82, trend: 82 },
];

export const Active: Story = {
  args: {
    weights: mockWeights,
  },
};

export const Idle: Story = {
  args: {
    weights: mockWeights.map((w) => ({ ...w, weight: w.weight - 10 })),
  },
};

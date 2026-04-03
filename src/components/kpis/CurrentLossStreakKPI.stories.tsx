import type { Meta, StoryObj } from "storybook-solidjs-vite";
import type { WeightEntry } from "../../shared";
import CurrentLossStreakKPI from "./CurrentLossStreakKPI";

const meta: Meta<typeof CurrentLossStreakKPI> = {
  component: CurrentLossStreakKPI,
  decorators: [
    (Story) => (
      <div style="width: min(33ch, 100%);">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CurrentLossStreakKPI>;

const mockWeights: WeightEntry[] = [
  { date: "2024-01-01", weight: 90, trend: 90 },
  { date: "2024-01-02", weight: 89.5, trend: 89.5 },
  { date: "2024-01-03", weight: 89, trend: 89 },
  { date: "2024-01-04", weight: 88.5, trend: 88.5 },
  { date: "2024-01-05", weight: 88, trend: 88 },
];

export const Active: Story = {
  args: {
    weights: mockWeights,
  },
};

export const Idle: Story = {
  args: {
    weights: mockWeights.map((w) => ({ ...w, weight: w.weight + 10 })),
  },
};

import type { Meta, StoryObj } from "storybook-solidjs-vite";
import type { WeightEntry } from "../../shared";
import LongestLossStreakKPI from "./LongestLossStreakKPI";

const meta: Meta<typeof LongestLossStreakKPI> = {
  component: LongestLossStreakKPI,
  decorators: [
    (Story) => (
      <div style="width: min(33ch, 100%);">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LongestLossStreakKPI>;

const mockWeights: WeightEntry[] = [
  { date: "2024-01-01", weight: 95, trend: 95 },
  { date: "2024-01-02", weight: 94.5, trend: 94.5 },
  { date: "2024-01-03", weight: 94, trend: 94 },
  { date: "2024-01-04", weight: 93.5, trend: 93.5 },
  { date: "2024-01-05", weight: 93, trend: 93 },
  { date: "2024-01-06", weight: 92.5, trend: 92.5 },
  { date: "2024-01-07", weight: 92, trend: 92 },
  { date: "2024-01-08", weight: 93, trend: 93 },
  { date: "2024-01-09", weight: 93.5, trend: 93.5 },
];

export const Default: Story = {
  args: {
    weights: mockWeights,
  },
};

export const NoStreak: Story = {
  args: {
    weights: [],
  },
};

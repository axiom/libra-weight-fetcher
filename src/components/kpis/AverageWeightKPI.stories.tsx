import type { Meta, StoryObj } from "storybook-solidjs-vite";
import type { WeightEntry } from "../../shared";
import AverageWeightKPI from "./AverageWeightKPI";

const meta: Meta<typeof AverageWeightKPI> = {
  component: AverageWeightKPI,
  decorators: [
    (Story) => (
      <div style="width: min(33ch, 100%);">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AverageWeightKPI>;

const mockWeights: WeightEntry[] = Array.from({ length: 30 }, (_, i) => ({
  date: `2024-01-${String(i + 1).padStart(2, "0")}`,
  weight: 80 + (Math.random() * 4 - 2),
  trend: 80,
}));

export const Default: Story = {
  args: {
    weights: mockWeights,
    days: 30,
    label: "30-Day Average",
  },
};

export const NoData: Story = {
  args: {
    weights: [],
    days: 30,
    label: "30-Day Average",
  },
};

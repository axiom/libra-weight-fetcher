import type { Meta, StoryObj } from "storybook-solidjs-vite";
import type { WeightEntry } from "../../shared";
import WeightRangeKPI from "./WeightRangeKPI";

const meta: Meta<typeof WeightRangeKPI> = {
  component: WeightRangeKPI,
  decorators: [
    (Story) => (
      <div style="width: min(33ch, 100%);">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WeightRangeKPI>;

const mockWeights: WeightEntry[] = Array(30)
  .fill(null)
  .map((_, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, "0")}`,
    weight: 80 + (i % 5) * 0.5,
    trend: 80,
  }));

export const Default: Story = {
  args: {
    weights: mockWeights,
    days: 30,
    label: "30-Day Range",
  },
};

export const NoData: Story = {
  args: {
    weights: [],
    days: 30,
    label: "30-Day Range",
  },
};

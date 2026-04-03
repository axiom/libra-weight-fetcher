import type { Meta, StoryObj } from "storybook-solidjs-vite";
import type { WeightEntry } from "../../shared";
import YearToDateChangeKPI from "./YearToDateChangeKPI";

const meta: Meta<typeof YearToDateChangeKPI> = {
  component: YearToDateChangeKPI,
  decorators: [
    (Story) => (
      <div style="width: min(33ch, 100%);">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof YearToDateChangeKPI>;

const mockWeights: WeightEntry[] = Array(90)
  .fill(null)
  .map((_, i) => ({
    date: `2024-01-${String((i % 30) + 1).padStart(2, "0")}`,
    weight: 90 - i * 0.05,
    trend: 90 - i * 0.05,
  }));

export const Default: Story = {
  args: {
    weights: mockWeights,
  },
};

export const NoData: Story = {
  args: {
    weights: [],
  },
};

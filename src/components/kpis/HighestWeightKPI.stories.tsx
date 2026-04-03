import type { Meta, StoryObj } from "storybook-solidjs-vite";
import type { WeightEntry } from "../../shared";
import HighestWeightKPI from "./HighestWeightKPI";

const meta: Meta<typeof HighestWeightKPI> = {
  component: HighestWeightKPI,
  decorators: [
    (Story) => (
      <div style="width: min(33ch, 100%);">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HighestWeightKPI>;

const mockWeights: WeightEntry[] = [
  { date: "2024-01-01", weight: 95, trend: 95 },
  { date: "2024-01-02", weight: 94, trend: 94 },
  { date: "2024-01-03", weight: 93, trend: 93 },
  { date: "2024-01-15", weight: 90, trend: 90 },
];

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

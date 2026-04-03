import type { Meta, StoryObj } from "storybook-solidjs-vite";
import type { WeightEntry } from "../../shared";
import CurrentWeightKPI from "./CurrentWeightKPI";

const meta: Meta<typeof CurrentWeightKPI> = {
  component: CurrentWeightKPI,
  decorators: [
    (Story) => (
      <div style="width: min(33ch, 100%);">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CurrentWeightKPI>;

const mockWeights: WeightEntry[] = [
  { date: "2024-01-01", weight: 90, trend: 89 },
  { date: "2024-01-02", weight: 89.5, trend: 88.5 },
  { date: "2024-01-03", weight: 89, trend: 88 },
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

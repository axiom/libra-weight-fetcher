import type { Meta, StoryObj } from "storybook-solidjs-vite";
import WeightKPIView from "./WeightKPIView";

const meta: Meta<typeof WeightKPIView> = {
  component: WeightKPIView,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof WeightKPIView>;

export const Default: Story = {
  args: {
    label: "Current Weight",
    value: "85.5 kg",
    icon: "⚖️",
    sentiment: "neutral",
    badge: null,
    meta: null,
  },
};

export const WithBadge: Story = {
  args: {
    label: "Weight Change",
    value: "-2.5 kg",
    icon: "📉",
    sentiment: "good",
    badge: { text: "Cutting", className: "text-green-700 bg-green-100" },
    meta: "30-day window",
  },
};

export const NoData: Story = {
  args: {
    label: "Current Weight",
    value: "N/A",
    icon: "➖",
    sentiment: "neutral",
    badge: null,
    meta: null,
  },
};

export const LongestLossStreak: Story = {
  args: {
    label: "Longest Loss Streak (Jan 2024)",
    value: "21 days",
    icon: "🏆",
    sentiment: "good",
    badge: { text: "Record", className: "text-amber-800 bg-amber-100" },
    meta: null,
  },
};

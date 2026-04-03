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
    valueClassName: "text-gray-900 dark:text-gray-100",
    badge: null,
    meta: null,
  },
};

export const WithBadge: Story = {
  args: {
    label: "Weight Change",
    value: "-2.5 kg",
    icon: "📉",
    valueClassName: "text-green-600",
    badge: { text: "Cutting", className: "text-green-700 bg-green-100" },
    meta: "30-day window",
  },
};

export const NoData: Story = {
  args: {
    label: "Current Weight",
    value: "N/A",
    icon: "➖",
    valueClassName: "text-gray-500",
    badge: null,
    meta: null,
  },
};

export const LongestLossStreak: Story = {
  args: {
    label: "Longest Loss Streak (Jan 2024)",
    value: "21 days",
    icon: "🏆",
    valueClassName: "text-green-600",
    badge: { text: "Record", className: "text-amber-800 bg-amber-100" },
    meta: null,
  },
};

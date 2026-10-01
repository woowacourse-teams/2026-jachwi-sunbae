import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ChecklistProgressBar from './ChecklistProgressBar';

const meta = {
  title: '체크리스트/ChecklistProgressBar',
  component: ChecklistProgressBar,
  parameters: {
    layout: 'padded',
  },
  args: {
    progress: {
      goodCount: 7,
      cautionCount: 2,
      unconfirmedCount: 3,
    },
  },
} satisfies Meta<typeof ChecklistProgressBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Compact: Story = {
  args: {
    compact: true,
    trailing: <strong>9/12</strong>,
  },
};

export const AllUnconfirmed: Story = {
  args: {
    progress: {
      goodCount: 0,
      cautionCount: 0,
      unconfirmedCount: 8,
    },
  },
};

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ChecklistProgressRing from './ChecklistProgressRing';

const meta = {
  title: '기능/체크리스트/ChecklistProgressRing',
  component: ChecklistProgressRing,
  parameters: {
    layout: 'padded',
  },
  args: {
    progress: { goodCount: 6, cautionCount: 2, unconfirmedCount: 4 },
  },
  argTypes: {
    progress: { control: 'object', description: '괜찮음, 주의, 미확인 개수. 고리 조각 비율과 범례 숫자가 바뀐다.' },
  },
} satisfies Meta<typeof ChecklistProgressRing>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllGood: Story = {
  args: {
    progress: { goodCount: 12, cautionCount: 0, unconfirmedCount: 0 },
  },
};

export const NotStarted: Story = {
  args: {
    progress: { goodCount: 0, cautionCount: 0, unconfirmedCount: 0 },
  },
};

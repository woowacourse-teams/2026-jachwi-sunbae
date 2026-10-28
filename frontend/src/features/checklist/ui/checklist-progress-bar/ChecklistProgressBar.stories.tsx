import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ChecklistProgressBar from './ChecklistProgressBar';

const meta = {
  title: '기능/체크리스트/ChecklistProgressBar',
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
    compact: false,
  },
  argTypes: {
    progress: { control: 'object', description: '괜찮음·주의·미확인 개수. 막대 비율과 범례 숫자가 바뀐다.' },
    compact: { description: '카드 안처럼 좁은 자리에 쓰는 작은 모양' },
    trailing: { control: false },
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

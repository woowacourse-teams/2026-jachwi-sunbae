import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@/shared/ui/button/Button';

import EmptyState from './EmptyState';

const meta = {
  title: '공통/EmptyState',
  component: EmptyState,
  args: {
    title: '저장한 매물이 없어요',
    description: '관심 있는 매물을 등록하면 이곳에서 비교할 수 있어요.',
    icon: 'home',
    variant: 'card',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['card', 'plain'],
    },
    icon: {
      control: 'text',
    },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Card: Story = {};

export const Plain: Story = {
  args: {
    variant: 'plain',
  },
};

export const WithAction: Story = {
  args: {
    action: <Button>첫 매물 등록하기</Button>,
  },
};

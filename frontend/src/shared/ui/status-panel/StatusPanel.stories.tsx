import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '../button/Button';
import StatusPanel from './StatusPanel';

const meta = {
  title: '공용/StatusPanel',
  component: StatusPanel,
  argTypes: {
    tone: {
      control: 'select',
      options: ['neutral', 'error', 'success'],
    },
    action: { control: false },
  },
  args: {
    title: '로그인을 확인하고 있어요',
    description: '잠시만 기다려 주세요.',
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof StatusPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Busy: Story = {
  args: {
    isBusy: true,
  },
};

export const Success: Story = {
  args: {
    tone: 'success',
    title: '로그인했어요',
    description: '곧 홈 화면으로 이동해요.',
  },
};

export const WithError: Story = {
  args: {
    tone: 'error',
    title: '로그인하지 못했어요',
    description: '카카오 로그인이 취소되었거나 시간이 지났어요. 다시 시도해 주세요.',
    action: <Button>다시 로그인하기</Button>,
  },
};

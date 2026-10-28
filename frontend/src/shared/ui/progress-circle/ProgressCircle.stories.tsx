import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ProgressCircle from './ProgressCircle';

const meta = {
  title: '공용/ProgressCircle',
  component: ProgressCircle,
  args: { size: 40, label: '로딩 중' },
  argTypes: {
    size: { control: 'inline-radio', options: [24, 40], description: '지름(px). 버튼 안은 24, 화면 로딩은 40.' },
    label: { control: 'text', description: '화면 낭독기가 읽는 진행 안내' },
  },
} satisfies Meta<typeof ProgressCircle>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Small: Story = { args: { size: 24 } };

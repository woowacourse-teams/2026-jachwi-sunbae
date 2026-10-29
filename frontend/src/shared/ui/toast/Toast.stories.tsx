import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import Toast from './Toast';

const meta = {
  title: '공용/Toast',
  component: Toast,
  args: {
    isOpen: true,
    title: '어디로 출퇴근·통학하세요?',
    description: '학교·회사 등 자주 가는 곳을 검색하거나\n지도에서 선택해주세요.',
    duration: 0,
    onClose: fn(),
  },
  argTypes: {
    isOpen: { description: '끄면 그리지 않는다.' },
    title: { description: '굵은 제목' },
    description: { control: 'text', description: '제목 아래 설명. 줄바꿈(\\n)을 그대로 보여 준다.' },
    duration: {
      control: { type: 'range', min: 0, max: 10000, step: 500 },
    },
    onClose: { control: false, description: '`duration`이 지나면 부르는 함수' },
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: 'min(100%, 390px)', height: '220px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Toast>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

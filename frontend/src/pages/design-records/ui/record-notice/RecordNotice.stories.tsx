import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import RecordNotice from './RecordNotice';

const meta = {
  title: '페이지/본 방 기록/공통/RecordNotice',
  component: RecordNotice,
  args: {
    message: '기록을 삭제했어요.',
    onClose: fn(),
  },
  argTypes: {
    message: { description: '띄울 안내 문구. 비우면 아무것도 그리지 않는다.' },
    onClose: { description: '닫기 버튼을 누르면 부른다.' },
  },
  decorators: [
    (Story) => (
      // 안내는 화면 아래쪽에 떠 있으므로 화면 크기의 칸 안에 둔다.
      <div style={{ position: 'relative', width: '24rem', height: '14rem', background: 'var(--color-surface)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecordNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    message: '기록을 삭제하지 못했어요. 다시 시도해주세요.',
  },
};

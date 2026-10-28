import type { Meta, StoryObj } from '@storybook/react-webpack5';

import RecordNotice from './RecordNotice';

const meta = {
  title: '페이지/본 방 기록/RecordNotice',
  component: RecordNotice,
  args: {
    message: '기록을 삭제했어요.',
    onClose: () => undefined,
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

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import AccountDeletionCard from './AccountDeletionCard';

const meta = {
  title: '페이지/마이/AccountDeletionCard',
  component: AccountDeletionCard,
  args: {
    memberId: 1024,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AccountDeletionCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ConfirmOpen: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /계정 및 데이터 삭제 요청/ }));
  },
};

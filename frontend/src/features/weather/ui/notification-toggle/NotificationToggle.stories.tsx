import type { Meta, StoryObj } from '@storybook/react-webpack5';

import NotificationToggle from './NotificationToggle';

const meta = {
  title: '기능/날씨/NotificationToggle',
  component: NotificationToggle,
  args: {
    checked: false,
    disabled: false,
    message: null,
    onToggle: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '22rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NotificationToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Off: Story = {};

export const On: Story = {
  args: {
    checked: true,
  },
};

export const WithMessage: Story = {
  args: {
    message: '알림은 앱에서 받을 수 있어요.',
  },
};

export const Updating: Story = {
  args: {
    checked: true,
    disabled: true,
  },
};

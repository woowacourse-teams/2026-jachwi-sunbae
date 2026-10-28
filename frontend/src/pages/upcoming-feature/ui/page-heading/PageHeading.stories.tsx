import type { Meta, StoryObj } from '@storybook/react-webpack5';

import PageHeading from './PageHeading';

const meta = {
  title: '페이지/준비 중 기능/PageHeading',
  component: PageHeading,
  args: {
    title: '준비 중인 기능이에요',
    description: '더 편하게 쓸 수 있도록 다듬고 있어요. 조금만 기다려 주세요.',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PageHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithBackLink: Story = {
  args: {
    backTo: '/',
    backLabel: '홈으로',
  },
};

export const TitleOnly: Story = {
  args: {
    description: undefined,
  },
};

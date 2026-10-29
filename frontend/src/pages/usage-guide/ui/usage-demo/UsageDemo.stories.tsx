import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UsageDemo from './UsageDemo';

const meta = {
  title: '페이지/사용 가이드/UsageDemo',
  component: UsageDemo,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '48rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UsageDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

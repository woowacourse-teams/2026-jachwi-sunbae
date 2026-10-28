import type { Meta, StoryObj } from '@storybook/react-webpack5';

import StreetMemoForm from './StreetMemoForm';

const meta = {
  title: '기능/거리 메모/StreetMemoForm',
  component: StreetMemoForm,
  args: {
    isSubmitting: false,
    submitFailed: false,
    onSubmit: () => undefined,
    onCancel: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '22rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StreetMemoForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Submitting: Story = {
  args: {
    isSubmitting: true,
  },
};

export const SubmitFailed: Story = {
  args: {
    submitFailed: true,
  },
};

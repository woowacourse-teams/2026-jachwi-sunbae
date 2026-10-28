import type { Meta, StoryObj } from '@storybook/react-webpack5';

import RecordDeleteButton from './RecordDeleteButton';

const meta = {
  title: '페이지/본 방 기록/RecordDeleteButton',
  component: RecordDeleteButton,
  args: {
    propertyId: 1,
    onDone: () => undefined,
  },
} satisfies Meta<typeof RecordDeleteButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

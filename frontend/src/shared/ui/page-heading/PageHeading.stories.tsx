import type { Meta, StoryObj } from '@storybook/react-webpack5';

import PageHeading from './PageHeading';

const meta = {
  title: '공용/PageHeading',
  component: PageHeading,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'overlap'],
    },
  },
  args: {
    title: '체크리스트',
  },
} satisfies Meta<typeof PageHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Overlap: Story = {
  args: {
    variant: 'overlap',
    title: '본 방 기록',
  },
};

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import PageHeading from './PageHeading';

const meta = {
  title: '공용/PageHeading',
  component: PageHeading,
  argTypes: {
    title: { description: '화면 제목' },
    variant: {
      control: 'inline-radio',
      options: ['default', 'overlap'],
      description: '`overlap`은 위 영역에 겹쳐 올라오는 둥근 흰 바탕 제목',
    },
  },
  args: {
    title: '체크리스트',
    variant: 'default',
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

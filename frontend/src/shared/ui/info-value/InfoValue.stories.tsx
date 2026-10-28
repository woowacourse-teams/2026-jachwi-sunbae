import type { Meta, StoryObj } from '@storybook/react-webpack5';

import InfoValue from './InfoValue';

const meta = {
  title: '공용/InfoValue',
  component: InfoValue,
  argTypes: {
    label: { description: '왼쪽 라벨' },
    value: { description: '오른쪽 값. 비우면 `emptyText`를 흐리게 보여 준다.' },
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof InfoValue>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Filled: Story = {
  args: {
    label: '매물 이름',
    value: '햇살 좋은 원룸',
  },
};

export const Empty: Story = {
  args: {
    label: '주소',
    value: '',
    emptyText: '주소를 입력해 주세요',
  },
};

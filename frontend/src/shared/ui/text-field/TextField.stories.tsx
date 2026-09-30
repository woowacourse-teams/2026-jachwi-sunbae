import type { Meta, StoryObj } from '@storybook/react-webpack5';

import TextField from './TextField';

const meta = {
  title: '공통/TextField',
  component: TextField,
  args: {
    label: '매물 이름',
    placeholder: '매물 이름 입력',
    floatingLabel: true,
    variant: 'underline',
    fieldSize: 'medium',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['underline', 'box'],
    },
    fieldSize: {
      control: 'select',
      options: ['medium', 'large'],
    },
    floatingLabel: { control: 'boolean' },
  },
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: {
    requirement: '필수',
  },
};

export const WithHelpAndError: Story = {
  args: {
    value: '입력한 값',
    helpText: '30자 이하로 입력해 주세요.',
    error: '이미 사용 중인 이름입니다.',
  },
};

export const LargeBox: Story = {
  args: {
    fieldSize: 'large',
    variant: 'box',
  },
};

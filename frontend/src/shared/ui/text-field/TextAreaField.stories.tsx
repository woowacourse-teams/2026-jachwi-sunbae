import type { Meta, StoryObj } from '@storybook/react-webpack5';

import TextAreaField from './TextAreaField';

const meta = {
  title: '공용/TextAreaField',
  component: TextAreaField,
  args: {
    label: '메모',
    placeholder: '그 외 내용을 자유롭게 적어보세요.',
    rows: 4,
    variant: 'underline',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['underline', 'box'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextAreaField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    value: '창문이 남향이라 낮에 밝음. 화장실 환풍기 소리가 조금 큼.',
    onChange: () => undefined,
  },
};

export const WithHelpAndError: Story = {
  args: {
    helpText: '2,000자 이하로 입력해 주세요.',
    error: '메모를 저장하지 못했어요.',
  },
};

export const Box: Story = {
  args: {
    variant: 'box',
  },
};

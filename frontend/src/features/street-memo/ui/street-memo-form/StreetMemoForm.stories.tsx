import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import StreetMemoForm from './StreetMemoForm';

const meta = {
  title: '기능/거리 메모/StreetMemoForm',
  component: StreetMemoForm,
  args: {
    isSubmitting: false,
    submitFailed: false,
    onSubmit: fn(),
    onCancel: fn(),
  },
  argTypes: {
    isSubmitting: { description: '저장 중. 저장 버튼이 로딩 상태가 된다.' },
    submitFailed: { description: '저장에 실패했다는 안내를 보인다.' },
    onSubmit: { description: '저장할 때. 메모 내용과 좋아요·싫어요를 넘긴다.' },
    onCancel: { description: '취소를 눌렀을 때' },
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

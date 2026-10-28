import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ConfirmDialog from './ConfirmDialog';

const meta = {
  title: '공용/ConfirmDialog',
  component: ConfirmDialog,
  argTypes: {
    description: { control: false },
    children: { control: false },
    returnFocusRef: { control: false },
    tone: {
      control: 'select',
      options: ['danger', 'primary'],
    },
  },
  args: {
    isOpen: true,
    title: '햇살 좋은 원룸을 삭제할까요?',
    description: <p>사진 4장과 체크 결과, 메모가 함께 삭제됩니다.</p>,
    confirmLabel: '매물 삭제',
    isConfirming: false,
    returnFocusRef: { current: null },
    onCancel: () => undefined,
    onConfirm: () => undefined,
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Danger: Story = {};

export const Primary: Story = {
  args: {
    tone: 'primary',
    title: '체크리스트를 바꿀까요?',
    description: <p>지금까지 체크한 결과는 그대로 두고, 새 체크리스트의 항목을 이어서 확인합니다.</p>,
    confirmLabel: '바꾸기',
  },
};

export const Confirming: Story = {
  args: {
    isConfirming: true,
  },
};

export const WithError: Story = {
  args: {
    children: (
      <p className="form-error" role="alert">
        네트워크 연결을 확인해 주세요. 매물은 그대로 유지됩니다.
      </p>
    ),
  },
};

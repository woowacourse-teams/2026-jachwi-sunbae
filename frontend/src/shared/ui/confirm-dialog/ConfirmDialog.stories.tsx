import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import ConfirmDialog from './ConfirmDialog';

/** 확인 버튼 위에 덧붙이는 내용. 값은 이름으로 두고 그릴 때 요소로 바꾼다. */
const extras = {
  없음: undefined,
  '오류 안내': (
    <p className="form-error" role="alert">
      네트워크 연결을 확인해 주세요. 매물은 그대로 유지됩니다.
    </p>
  ),
};

const meta = {
  title: '공용/ConfirmDialog',
  component: ConfirmDialog,
  argTypes: {
    isOpen: { description: '켜면 모달로 열고, 끄면 닫은 뒤 `returnFocusRef`로 포커스를 돌려준다.' },
    title: { description: '대화상자 제목(질문)' },
    description: { control: 'text', description: '제목 아래 설명' },
    confirmLabel: { description: '확인 버튼 문구' },
    isConfirming: { description: '처리 중이면 두 버튼을 막고 확인 버튼에 스피너를 보여 준다.' },
    children: {
      control: 'inline-radio',
      options: Object.keys(extras),
      mapping: extras,
      description: '설명과 버튼 사이에 덧붙이는 내용(오류 안내 등)',
    },
    returnFocusRef: { control: false },
    tone: {
      control: 'inline-radio',
      options: ['danger', 'primary'],
      description: '확인 버튼 색. 지우기처럼 되돌릴 수 없으면 `danger`.',
    },
    onCancel: { control: false },
    onConfirm: { control: false },
    onAfterClose: { control: false },
  },
  args: {
    isOpen: true,
    title: '햇살 좋은 원룸을 삭제할까요?',
    description: '사진 4장과 체크 결과, 메모가 함께 삭제됩니다.',
    confirmLabel: '매물 삭제',
    isConfirming: false,
    tone: 'danger',
    children: '없음',
    returnFocusRef: { current: null },
    onCancel: fn(),
    onConfirm: fn(),
    onAfterClose: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Danger: Story = {};

export const Primary: Story = {
  args: {
    tone: 'primary',
    title: '체크리스트를 바꿀까요?',
    description: '지금까지 체크한 결과는 그대로 두고, 새 체크리스트의 항목을 이어서 확인합니다.',
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
    children: '오류 안내',
  },
};

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import ChecklistItemRow from './ChecklistItemRow';

const meta = {
  title: '기능/체크리스트/ChecklistItemRow',
  component: ChecklistItemRow,
  parameters: {
    layout: 'padded',
  },
  args: {
    itemKey: 'story-item-1',
    question: '창문 방향과 채광을 확인했나요?',
    guide: '낮과 저녁에 주변 건물 그림자를 함께 확인해 보세요.',
    originLabel: '제공 항목',
    dragHandleLabel: '채광 항목 순서 변경',
    removeLabel: '채광 항목 제거',
    isDisabled: false,
    isDragging: false,
    isDragOver: false,
    onRemove: fn(),
    onDragHandleKeyDown: fn(),
  },
  argTypes: {
    itemKey: { description: '항목을 구분하는 키. 화면에는 보이지 않는다.' },
    question: { description: '항목 질문' },
    guide: { control: 'text', description: '질문 아래 안내. 비우면 그리지 않는다.' },
    originLabel: { description: '제공 항목·이전 사용자 항목 같은 출처 표시' },
    inactiveNote: { description: '더 이상 제공하지 않는 항목에 붙는 안내' },
    isDisabled: { description: '순서 변경·제거 버튼을 막는다.' },
    isDragging: { description: '끌고 있는 항목' },
    isDragOver: { description: '끌고 있는 항목이 이 위에 있음' },
    dragHandleLabel: { description: '순서 변경 손잡이의 접근성 이름' },
    removeLabel: { description: '제거 버튼의 접근성 이름' },
    onRemove: { description: '제거를 눌렀을 때. 없으면 제거 버튼을 그리지 않는다.' },
    onDragHandleKeyDown: { control: false, description: '손잡이에서 방향키를 눌렀을 때' },
    contentRef: { control: false },
    dragHandleProps: { control: false },
    trailing: { control: false },
  },
} satisfies Meta<typeof ChecklistItemRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomItem: Story = {
  args: {
    question: '엘리베이터 소음이 밤에도 괜찮은가요?',
    guide: null,
    originLabel: '이전 사용자 항목',
    inactiveNote: '이전에 추가된 항목 · 이동 또는 제거 가능',
  },
};

export const Dragging: Story = {
  args: {
    isDragging: true,
  },
};

export const DragOver: Story = {
  args: {
    isDragOver: true,
  },
};

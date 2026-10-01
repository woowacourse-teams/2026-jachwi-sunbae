import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ChecklistItemRow from './ChecklistItemRow';

const meta = {
  title: '체크리스트/ChecklistItemRow',
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
  },
} satisfies Meta<typeof ChecklistItemRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onRemove: () => undefined,
  },
};

export const CustomItem: Story = {
  args: {
    question: '엘리베이터 소음이 밤에도 괜찮은가요?',
    guide: null,
    originLabel: '이전 사용자 항목',
    inactiveNote: '이전에 추가된 항목 · 이동 또는 제거 가능',
    onRemove: () => undefined,
  },
};

export const Dragging: Story = {
  args: {
    isDragging: true,
    onRemove: () => undefined,
  },
};

export const DragOver: Story = {
  args: {
    isDragOver: true,
    onRemove: () => undefined,
  },
};

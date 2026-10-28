import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { ChecklistEditorItem } from '../../model/ChecklistEditor';
import ChecklistItemOrderList from './ChecklistItemOrderList';

const sampleItems: ChecklistEditorItem[] = [
  {
    clientKey: 'existing:1',
    origin: 'PROVIDED',
    checklistItemId: 1,
    sourceCheckItemId: 101,
    question: '창문 방향과 채광을 확인했나요?',
    guide: '낮과 저녁에 주변 건물 그림자를 함께 확인해 보세요.',
    itemType: 'CORE',
    active: true,
  },
  {
    clientKey: 'existing:2',
    origin: 'PROVIDED',
    checklistItemId: 2,
    sourceCheckItemId: 199,
    question: '현관 도어락이 잘 잠기나요?',
    guide: null,
    itemType: 'OPTIONAL',
    active: false,
  },
  {
    clientKey: 'existing:3',
    origin: 'CUSTOM',
    checklistItemId: 3,
    sourceCheckItemId: null,
    question: '엘리베이터 소음이 밤에도 괜찮은가요?',
    guide: null,
    itemType: 'OPTIONAL',
    active: true,
  },
];

const meta = {
  title: '기능/체크리스트/ChecklistItemOrderList',
  component: ChecklistItemOrderList,
  args: {
    items: sampleItems,
    isDisabled: false,
    isInactive: (item) => item.origin === 'PROVIDED' && item.sourceCheckItemId === 199,
    registerFocusTarget: () => () => undefined,
    onMove: () => undefined,
    onReorder: () => undefined,
    onRemove: () => undefined,
  },
  argTypes: {
    items: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChecklistItemOrderList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    isDisabled: true,
  },
};

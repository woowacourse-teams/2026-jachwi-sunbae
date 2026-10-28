import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

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
    onMove: fn(),
    onReorder: fn(),
    onRemove: fn(),
  },
  argTypes: {
    items: { control: 'object', description: '순서대로 그릴 편집 항목' },
    isDisabled: { description: '저장 중처럼 순서 변경·삭제를 막는다.' },
    isInactive: {
      control: false,
      description: '지금은 제공하지 않는 항목인지 판단한다. 표본은 199번 제공 항목을 비활성으로 본다.',
    },
    registerFocusTarget: { control: false, description: '이동 뒤 포커스를 옮길 요소를 등록한다.' },
    onMove: { description: '키보드로 한 칸 옮길 때 (index, -1 | 1)' },
    onReorder: { description: '끌어서 놓을 때 (옮긴 항목 키, 놓은 자리 항목 키)' },
    onRemove: { description: '항목 제거를 눌렀을 때 (index)' },
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

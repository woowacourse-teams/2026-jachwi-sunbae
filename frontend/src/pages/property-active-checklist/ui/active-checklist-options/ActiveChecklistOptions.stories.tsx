import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { ChecklistSummary } from '@/features/checklist/model/checklistTypes';

import { SYSTEM_DEFAULT_ID } from '../../hooks/useChecklistSelection';
import ActiveChecklistOptions from './ActiveChecklistOptions';

const checklists: ChecklistSummary[] = [
  {
    checklistId: 3,
    name: '원룸 현장 확인',
    stage: 'ON_SITE',
    itemCount: 12,
    assignedPropertyCount: 2,
    updatedAt: '2026-10-20T14:30:00',
  },
  {
    checklistId: 8,
    name: '야간 방문용',
    stage: 'ON_SITE',
    itemCount: 5,
    assignedPropertyCount: 0,
    updatedAt: '2026-10-27T21:40:00',
  },
];

const meta = {
  title: '페이지/체크리스트 진행/ActiveChecklistOptions',
  component: ActiveChecklistOptions,
  args: {
    items: checklists,
    selectedId: SYSTEM_DEFAULT_ID,
    newlyCreatedId: null,
    isDisabled: false,
    onSelect: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActiveChecklistOptions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NewlyCreated: Story = {
  args: {
    selectedId: 8,
    newlyCreatedId: 8,
  },
};

export const NoCustomChecklist: Story = {
  args: {
    items: [],
  },
};

export const Disabled: Story = {
  args: {
    selectedId: 3,
    isDisabled: true,
  },
};

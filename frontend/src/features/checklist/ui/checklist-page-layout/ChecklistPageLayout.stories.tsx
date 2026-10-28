import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ChecklistPageLayout from './ChecklistPageLayout';

const meta = {
  title: '기능/체크리스트/ChecklistPageLayout',
  component: ChecklistPageLayout,
  args: {
    title: '체크리스트',
    backTo: '/checklists',
    children: <p style={{ margin: '1rem 0' }}>현장에서 확인할 항목을 단계별로 모아 둔 체크리스트를 고를 수 있어요.</p>,
  },
  argTypes: {
    children: { control: false },
    endSlot: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ChecklistPageLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CloseNavigation: Story = {
  args: {
    title: '체크 항목 추가',
    navigationIcon: 'close',
    backLabel: '항목 추가 닫기',
    backTo: undefined,
    onBack: () => undefined,
  },
};

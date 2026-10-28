import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

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
    title: { description: '위 내비게이션 가운데 제목' },
    backTo: { description: '뒤로 갈 주소. onBack이 없을 때 쓴다.' },
    backLabel: { description: '뒤로·닫기 버튼의 접근성 이름' },
    navigationIcon: { control: 'inline-radio', options: ['arrow-left', 'close'], description: '왼쪽 버튼 모양' },
    onBack: { description: '뒤로·닫기를 눌렀을 때. 주면 backTo 대신 부른다.' },
    children: { control: false },
    endSlot: { control: false },
    containerClassName: { control: false },
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
    onBack: fn(),
  },
};

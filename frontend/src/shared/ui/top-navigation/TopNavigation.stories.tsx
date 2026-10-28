import type { Meta, StoryObj } from '@storybook/react-webpack5';

import TopNavigation from './TopNavigation';

const meta = {
  title: '공용/TopNavigation',
  component: TopNavigation,
  argTypes: {
    navigationIcon: {
      control: 'select',
      options: ['arrow-left', 'close'],
    },
    meta: { control: false },
    endSlot: { control: false },
  },
  args: {
    title: '체크리스트 만들기',
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof TopNavigation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    backTo: '/checklists',
    backLabel: '체크리스트 목록으로 돌아가기',
  },
};

export const WithMeta: Story = {
  args: {
    title: '현장 확인 체크리스트',
    backTo: '/properties/10',
    meta: '3/12',
    endSlot: (
      <button type="button" className="inline-button">
        저장
      </button>
    ),
  },
};

export const CloseAction: Story = {
  args: {
    title: '사진 보기',
    navigationIcon: 'close',
    backLabel: '사진 보기 닫기',
    onBack: () => undefined,
  },
};

export const TitleOnly: Story = {
  args: {
    title: '신림역 5분 거리 채광 좋은 투룸 오피스텔 (관리비 포함)',
  },
};

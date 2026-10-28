import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import TopNavigation from './TopNavigation';

/** 오른쪽 끝 자리. 값은 이름으로 두고 그릴 때 요소로 바꾼다. */
const endSlots = {
  없음: undefined,
  '저장 버튼': (
    <button type="button" className="inline-button">
      저장
    </button>
  ),
};

const meta = {
  title: '공용/TopNavigation',
  component: TopNavigation,
  argTypes: {
    title: { description: '화면 제목. 길면 한 줄로 줄인다.' },
    navigationIcon: {
      control: 'inline-radio',
      options: ['arrow-left', 'close'],
      description: '뒤로 가기 아이콘. 덮어 연 화면은 `close`.',
    },
    backTo: { control: 'text', description: '뒤로 가기 링크 주소. `onBack`을 주면 이 값보다 버튼이 먼저다.' },
    backLabel: { description: '뒤로 가기 버튼을 화면 낭독기가 읽는 이름' },
    onBack: { control: false },
    meta: { control: 'text', description: '오른쪽 보조 정보(진행 수 등)' },
    endSlot: { control: 'inline-radio', options: Object.keys(endSlots), mapping: endSlots },
  },
  args: {
    title: '체크리스트 만들기',
    navigationIcon: 'arrow-left',
    endSlot: '없음',
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
    endSlot: '저장 버튼',
  },
};

export const CloseAction: Story = {
  args: {
    title: '사진 보기',
    navigationIcon: 'close',
    backLabel: '사진 보기 닫기',
    onBack: fn(),
  },
};

export const TitleOnly: Story = {
  args: {
    title: '신림역 5분 거리 채광 좋은 투룸 오피스텔 (관리비 포함)',
  },
};

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import { checklistQueryKeys } from '../../api/checklistQueryKeys';
import type { CheckItem, CheckItemPage } from '../../model/checklistTypes';
import CheckItemPicker from './CheckItemPicker';

const sampleItems: CheckItem[] = [
  {
    checkItemId: 101,
    stage: 'ON_SITE',
    itemType: 'CORE',
    question: '창문 방향과 채광을 확인했나요?',
    guide: '낮과 저녁에 주변 건물 그림자를 함께 확인해 보세요.',
  },
  {
    checkItemId: 102,
    stage: 'ON_SITE',
    itemType: 'CORE',
    question: '수압이 충분한가요?',
    guide: '세면대와 샤워기를 동시에 틀어 물줄기를 확인해 보세요.',
  },
  {
    checkItemId: 103,
    stage: 'ON_SITE',
    itemType: 'OPTIONAL',
    question: '벽지나 천장에 곰팡이 흔적이 있나요?',
    guide: '옷장 뒤와 창틀 모서리를 꼭 살펴보세요.',
  },
  {
    checkItemId: 104,
    stage: 'ON_SITE',
    itemType: 'OPTIONAL',
    question: '밤에 주변 소음이 심한가요?',
    guide: null,
  },
];

const searchPage = (content: CheckItem[]): { pages: CheckItemPage[]; pageParams: number[] } => ({
  pages: [{ content, page: 0, size: 20, totalElements: content.length, totalPages: 1, hasNext: false }],
  pageParams: [0],
});

const meta = {
  title: '기능/체크리스트/CheckItemPicker',
  component: CheckItemPicker,
  args: {
    stage: 'ON_SITE',
    existingSourceIds: [],
    disabled: false,
    onCancel: fn(),
    onAdd: fn(),
  },
  argTypes: {
    stage: {
      control: false,
      description: '검색할 체크리스트 단계. 표본 검색 결과가 현장(ON_SITE) 기준이라 고정한다.',
    },
    existingSourceIds: {
      control: 'object',
      description: '이미 체크리스트에 담긴 체크 항목 ID. 목록 아래로 내려가고 고를 수 없다.',
    },
    disabled: { description: '저장 중처럼 항목 추가를 막는다.' },
    onCancel: { description: '닫기를 눌렀을 때' },
    onAdd: { description: '고른 항목을 추가할 때. 고른 체크 항목 배열을 넘긴다.' },
  },
  parameters: {
    layout: 'fullscreen',
    queryData: [[checklistQueryKeys.checkItems('ON_SITE', ''), searchPage(sampleItems)]],
  },
} satisfies Meta<typeof CheckItemPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithExistingItems: Story = {
  args: {
    existingSourceIds: [101, 102],
  },
};

export const Empty: Story = {
  parameters: {
    queryData: [[checklistQueryKeys.checkItems('ON_SITE', ''), searchPage([])]],
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

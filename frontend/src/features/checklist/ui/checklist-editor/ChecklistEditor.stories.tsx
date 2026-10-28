import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import { checklistQueryKeys } from '../../api/checklistQueryKeys';
import type { CheckItem, ChecklistDetail, ChecklistItem } from '../../model/checklistTypes';
import useChecklistDraft, { type ChecklistDraftInput } from '../../model/useChecklistDraft';
import ChecklistEditor from './ChecklistEditor';

const activeItems: CheckItem[] = [
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
];

const savedItems: ChecklistItem[] = [
  {
    checklistItemId: 1,
    origin: 'PROVIDED',
    sourceCheckItemId: 101,
    checkItemId: 101,
    itemType: 'CORE',
    question: '창문 방향과 채광을 확인했나요?',
    guide: '낮과 저녁에 주변 건물 그림자를 함께 확인해 보세요.',
    order: 1,
    active: true,
  },
  {
    checklistItemId: 2,
    origin: 'PROVIDED',
    sourceCheckItemId: 102,
    checkItemId: 102,
    itemType: 'CORE',
    question: '수압이 충분한가요?',
    guide: '세면대와 샤워기를 동시에 틀어 물줄기를 확인해 보세요.',
    order: 2,
    active: true,
  },
  {
    checklistItemId: 3,
    origin: 'PROVIDED',
    sourceCheckItemId: 199,
    checkItemId: 199,
    itemType: 'OPTIONAL',
    question: '현관 도어락이 잘 잠기나요?',
    guide: null,
    order: 3,
    active: false,
  },
  {
    checklistItemId: 4,
    origin: 'CUSTOM',
    sourceCheckItemId: null,
    checkItemId: null,
    itemType: 'OPTIONAL',
    question: '엘리베이터 소음이 밤에도 괜찮은가요?',
    guide: null,
    order: 4,
    active: true,
  },
];

const savedDetail: ChecklistDetail = {
  checklistId: 7,
  name: '신림 원룸 현장 점검',
  stage: 'ON_SITE',
  items: savedItems,
  itemCount: savedItems.length,
  assignedPropertyCount: 2,
  createdAt: '2026-10-20T10:00:00+09:00',
  updatedAt: '2026-10-21T15:30:00+09:00',
};

type EditorStoryProps = {
  initialName: string;
  initialItems: ChecklistItem[];
  submitLabel: string;
  isSubmitting: boolean;
  serverError?: string;
  onOpenItemPicker: () => void;
  onSubmit: (input: ChecklistDraftInput) => Promise<ChecklistDetail>;
};

/** 편집 상태(draft)는 Hook이 만들므로, Hook에 넣을 처음 값과 편집기 props를 args로 받는다. */
const EditorStory = ({ initialName, initialItems, isSubmitting, ...editorProps }: EditorStoryProps) => {
  const draft = useChecklistDraft({ initialName, initialItems, isSubmitting });
  return <ChecklistEditor stage="ON_SITE" draft={draft} isSubmitting={isSubmitting} {...editorProps} />;
};

const meta = {
  title: '기능/체크리스트/ChecklistEditor',
  component: EditorStory,
  args: {
    initialName: '신림 원룸 현장 점검',
    initialItems: savedItems,
    submitLabel: '체크리스트 저장',
    isSubmitting: false,
    onOpenItemPicker: fn(),
    onSubmit: fn(() => Promise.resolve(savedDetail)),
  },
  argTypes: {
    initialName: { description: '편집 상태 Hook에 넣는 처음 이름. 저장할 때 함께 보낸다.' },
    initialItems: {
      control: 'object',
      description: '편집 상태 Hook에 넣는 처음 항목. 비활성(active: false) 제공 항목은 안내가 붙는다.',
    },
    submitLabel: { description: '아래 저장 버튼 문구' },
    isSubmitting: { description: '저장 중. 버튼이 로딩 상태가 되고 편집을 막는다.' },
    serverError: { control: 'text', description: '저장 실패 안내. 비우면 그리지 않는다.' },
    onOpenItemPicker: { description: '체크 항목 추가를 눌렀을 때' },
    onSubmit: { description: '저장할 때. 이름과 항목 순서를 넘기고 저장된 체크리스트를 돌려받는다.' },
  },
  parameters: {
    layout: 'fullscreen',
    queryData: [
      [
        checklistQueryKeys.activeCheckItems('ON_SITE'),
        { content: activeItems, page: 0, size: 100, totalElements: activeItems.length, totalPages: 1, hasNext: false },
      ],
    ],
  },
} satisfies Meta<typeof EditorStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    initialName: '',
    initialItems: [],
    submitLabel: '체크리스트 만들기',
  },
};

export const Submitting: Story = {
  args: {
    isSubmitting: true,
  },
};

export const WithServerError: Story = {
  args: {
    serverError: '체크리스트를 저장하지 못했어요.',
  },
};

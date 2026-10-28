import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { checklistQueryKeys } from '../../api/checklistQueryKeys';
import type { CheckItem, ChecklistDetail, ChecklistItem } from '../../model/checklistTypes';
import useChecklistDraft from '../../model/useChecklistDraft';
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
};

const EditorStory = ({ initialName, initialItems, submitLabel, isSubmitting, serverError }: EditorStoryProps) => {
  const draft = useChecklistDraft({ initialName, initialItems, isSubmitting });
  return (
    <ChecklistEditor
      stage="ON_SITE"
      draft={draft}
      submitLabel={submitLabel}
      isSubmitting={isSubmitting}
      serverError={serverError}
      onOpenItemPicker={() => undefined}
      onSubmit={() => Promise.resolve(savedDetail)}
    />
  );
};

const meta = {
  title: '기능/체크리스트/ChecklistEditor',
  component: EditorStory,
  args: {
    initialName: '신림 원룸 현장 점검',
    initialItems: savedItems,
    submitLabel: '체크리스트 저장',
    isSubmitting: false,
  },
  argTypes: {
    initialItems: { control: false },
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

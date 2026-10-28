import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { StreetMemoLayer } from '../../hooks/useStreetMemoLayer';
import type { StreetMemo } from '../../model/StreetMemo';
import StreetMemoSheet from './StreetMemoSheet';

const likeMemo: StreetMemo = {
  id: 1,
  latitude: 37.4842,
  longitude: 126.9297,
  memo: '늦게까지 여는 세탁소가 있어요.\n골목이 밝아서 밤에도 다니기 괜찮아요.',
  preference: 'LIKE',
  isMine: true,
};

const dislikeMemo: StreetMemo = {
  id: 2,
  latitude: 37.4851,
  longitude: 126.9312,
  memo: '주말 밤에는 술집 소음이 커요.',
  preference: 'DISLIKE',
  isMine: false,
};

/** 화면이 Hook으로 만드는 메모 겹 상태를 표본으로 만든다. */
const makeLayer = (overrides: Partial<StreetMemoLayer>): StreetMemoLayer => ({
  markers: [],
  isFailed: false,
  mode: null,
  selectedMemo: null,
  selectedMarkerId: null,
  isSubmitting: false,
  submitFailed: false,
  isRemoving: false,
  removeFailed: false,
  selectMarker: () => false,
  startDraft: () => undefined,
  submit: () => undefined,
  remove: () => undefined,
  close: () => undefined,
  ...overrides,
});

const meta = {
  title: '기능/거리 메모/StreetMemoSheet',
  component: StreetMemoSheet,
  args: {
    layer: makeLayer({ mode: 'view', selectedMemo: likeMemo }),
  },
  argTypes: {
    layer: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof StreetMemoSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const View: Story = {};

export const Compose: Story = {
  args: {
    layer: makeLayer({ mode: 'compose' }),
  },
};

export const OthersMemo: Story = {
  args: {
    layer: makeLayer({ mode: 'view', selectedMemo: dislikeMemo }),
  },
};

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import StreetMemoDetails from './StreetMemoDetails';

const meta = {
  title: '기능/거리 메모/StreetMemoDetails',
  component: StreetMemoDetails,
  args: {
    memo: {
      id: 1,
      latitude: 37.4842,
      longitude: 126.9297,
      memo: '늦게까지 여는 세탁소가 있어요.\n골목이 밝아서 밤에도 다니기 괜찮아요.',
      preference: 'LIKE',
      isMine: true,
    },
    isRemoving: false,
    removeFailed: false,
    onRemove: fn(),
  },
  argTypes: {
    memo: {
      control: 'object',
      description:
        '보여줄 메모. preference(LIKE·DISLIKE)로 좋아요·싫어요가 갈리고, isMine이면 내 메모 표시와 지우기 버튼이 붙는다.',
    },
    isRemoving: { description: '지우는 중. 지우기 확인 버튼이 "지우는 중…"으로 바뀐다.' },
    removeFailed: { description: '지우지 못했다는 안내를 보인다.' },
    onRemove: { description: '지우기를 확인했을 때' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '22rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StreetMemoDetails>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MyMemo: Story = {};

export const OthersMemo: Story = {
  args: {
    memo: {
      id: 2,
      latitude: 37.4851,
      longitude: 126.9312,
      memo: '주말 밤에는 술집 소음이 커요.',
      preference: 'DISLIKE',
      isMine: false,
    },
  },
};

export const RemoveFailed: Story = {
  args: {
    removeFailed: true,
  },
};

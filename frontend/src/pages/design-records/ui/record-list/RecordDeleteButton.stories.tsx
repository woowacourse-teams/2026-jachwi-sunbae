import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import RecordDeleteButton from './RecordDeleteButton';

const meta = {
  title: '페이지/본 방 기록/공통/RecordDeleteButton',
  component: RecordDeleteButton,
  args: {
    propertyId: 1,
    onDone: fn(),
  },
  argTypes: {
    propertyId: { description: '삭제할 매물 번호' },
    onDone: { description: '삭제가 끝나면(성공·실패) 안내 문구로 부른다.' },
  },
} satisfies Meta<typeof RecordDeleteButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import AddItemAction from './AddItemAction';

// to/onClick 유니언 props라 satisfies 대신 타입을 직접 지정한다.
const meta: Meta<typeof AddItemAction> = {
  title: '공용/AddItemAction',
  component: AddItemAction,
  args: {
    children: '체크 항목 추가',
    disabled: false,
    onClick: fn(),
  },
  argTypes: {
    children: { control: 'text', description: '버튼 문구' },
    disabled: { description: '버튼으로 그릴 때만 적용된다.' },
    to: { control: 'text', description: '이동할 주소. 주면 링크로, 비우고 `onClick`을 주면 버튼으로 그린다.' },
    onClick: { control: false, description: '그 자리에서 추가 화면을 열 때 부르는 함수' },
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof AddItemAction>;

export const Button: Story = {};

export const Link: Story = {
  args: {
    children: '새 항목 목록으로 이동',
    to: '/checklists/new/items',
    onClick: undefined,
  },
};

export const Disabled: Story = {
  args: {
    children: '저장 중에는 추가할 수 없어요',
    disabled: true,
  },
};

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router-dom';

import AddItemAction from './AddItemAction';

const meta = {
  title: '공통/AddItemAction',
  component: AddItemAction,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof AddItemAction>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Button: Story = {
  args: {
    children: '체크 항목 추가',
    onClick: () => undefined,
  },
};

export const Link: Story = {
  args: {
    children: '새 항목 목록으로 이동',
    to: '/checklists/new/items',
  },
  render: ({ children }) => (
    <MemoryRouter initialEntries={['/checklists/new']}>
      <AddItemAction to="/checklists/new/items">{children}</AddItemAction>
    </MemoryRouter>
  ),
};

export const Disabled: Story = {
  args: {
    children: '저장 중에는 추가할 수 없어요',
    disabled: true,
    onClick: () => undefined,
  },
};

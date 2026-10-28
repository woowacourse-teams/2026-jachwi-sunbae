import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Link } from 'react-router-dom';

import TopNavigationMenu from './TopNavigationMenu';

const meta = {
  title: '공용/TopNavigationMenu',
  component: TopNavigationMenu,
  argTypes: {
    children: { control: false },
  },
  args: {
    label: '매물 메뉴 열기',
    children: (
      <>
        <Link to="/properties/10/memo">메모 편집</Link>
        <button type="button" data-tone="danger">
          매물 삭제
        </button>
      </>
    ),
  },
} satisfies Meta<typeof TopNavigationMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

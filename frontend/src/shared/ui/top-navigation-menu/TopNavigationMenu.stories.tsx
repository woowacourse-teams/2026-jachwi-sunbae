import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Link } from 'react-router-dom';
import { fn } from 'storybook/test';

import TopNavigationMenu from './TopNavigationMenu';

/** 펼친 메뉴 항목에 단 클릭. 누르면 Actions 패널에 찍힌다. */
const onDelete = fn().mockName('매물 삭제');

const meta = {
  title: '공용/TopNavigationMenu',
  component: TopNavigationMenu,
  argTypes: {
    label: { control: 'text', description: '⋮ 버튼을 화면 낭독기가 읽는 이름' },
    children: { control: false },
  },
  args: {
    label: '매물 메뉴 열기',
    children: (
      <>
        <Link to="/properties/10/memo">메모 편집</Link>
        <button type="button" data-tone="danger" onClick={onDelete}>
          매물 삭제
        </button>
      </>
    ),
  },
} satisfies Meta<typeof TopNavigationMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

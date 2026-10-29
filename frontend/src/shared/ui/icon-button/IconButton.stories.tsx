import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import Icon, { type IconName } from '../icon/Icon';
import IconButton from './IconButton';

const iconNames: IconName[] = ['refresh', 'search', 'close', 'more-vertical', 'locate', 'edit', 'trash', 'plus'];

/** 컨트롤에서 아이콘 이름을 고르면 아이콘 요소로 바꿔 넣는다. */
const icons = Object.fromEntries(iconNames.map((name) => [name, <Icon key={name} name={name} size={20} />]));

// to/onClick 유니언 props라 satisfies 대신 타입을 직접 지정한다.
const meta: Meta<typeof IconButton> = {
  title: '공용/IconButton',
  component: IconButton,
  args: {
    label: '새로고침',
    children: 'refresh',
    onClick: fn(),
  },
  argTypes: {
    label: { description: '아이콘만 있으므로 화면 낭독기가 읽을 이름이 꼭 필요하다.' },
    children: { control: 'select', options: iconNames, mapping: icons, description: '가운데 아이콘' },
    to: { control: 'text', description: '이동할 주소. 주면 링크로, 비우고 `onClick`을 주면 버튼으로 그린다.' },
    onClick: { control: false },
  },
};

export default meta;

type Story = StoryObj<typeof IconButton>;

export const Action: Story = {};

export const Link: Story = {
  args: {
    label: '검색 화면으로 이동',
    children: 'search',
    to: '/search',
    onClick: undefined,
  },
};

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Icon from '../icon/Icon';
import IconButton from './IconButton';

const meta: Meta<typeof IconButton> = {
  title: '공용/IconButton',
  component: IconButton,
};

export default meta;

type Story = StoryObj;

/* `to`·`onClick` 중 하나만 받는 유니언 props라 args 대신 직접 그린다. */
export const Action: Story = {
  render: () => (
    <IconButton label="새로고침" onClick={() => undefined}>
      <Icon name="refresh" size={20} />
    </IconButton>
  ),
};

export const Link: Story = {
  render: () => (
    <IconButton label="검색 화면으로 이동" to="/search">
      <Icon name="search" size={20} />
    </IconButton>
  ),
};

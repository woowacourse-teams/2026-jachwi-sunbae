import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router-dom';

import PageAction from './PageAction';

const meta = {
  title: '공통/PageAction',
  component: PageAction,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof PageAction>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FloatingLink: Story = {
  args: {
    children: '매물 추가',
    to: '/properties/new',
  },
  render: () => (
    <MemoryRouter initialEntries={['/properties']}>
      <PageAction to="/properties/new">매물 추가</PageAction>
    </MemoryRouter>
  ),
};

export const InlineButton: Story = {
  args: {
    children: '지도에서 추가',
    placement: 'inline',
    icon: 'map',
    onClick: () => undefined,
  },
  render: () => (
    <PageAction placement="inline" icon="map" onClick={() => undefined}>
      지도에서 추가
    </PageAction>
  ),
};

export const CloseButton: Story = {
  args: {
    children: '닫기',
    placement: 'inline',
    icon: 'close',
    onClick: () => undefined,
  },
  render: () => (
    <PageAction placement="inline" icon="close" onClick={() => undefined}>
      닫기
    </PageAction>
  ),
};

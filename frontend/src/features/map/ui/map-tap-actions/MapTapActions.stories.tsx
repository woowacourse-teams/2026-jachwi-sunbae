import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import MapTapActions from './MapTapActions';

const meta = {
  title: '기능/지도/MapTapActions',
  component: MapTapActions,
  args: {
    actions: [
      { id: 'memo', label: '거리 메모 남기기', onSelect: fn() },
      { id: 'nearby', label: '주변 시설 보기', onSelect: fn() },
    ],
  },
  argTypes: {
    actions: {
      control: false,
      description:
        '찍은 자리에서 고를 동작 목록. 함수가 들어 있어 컨트롤로 고치지 않는다. 각 onSelect는 Actions 패널에 찍힌다.',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '24rem', height: '12rem', background: '#e9e5d8' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MapTapActions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleAction: Story = {
  args: {
    actions: [{ id: 'select', label: '이 위치로 정하기', onSelect: fn() }],
  },
};

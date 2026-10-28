import type { Meta, StoryObj } from '@storybook/react-webpack5';

import MapTapActions from './MapTapActions';

const meta = {
  title: '기능/지도/MapTapActions',
  component: MapTapActions,
  args: {
    actions: [
      { id: 'memo', label: '거리 메모 남기기', onSelect: () => undefined },
      { id: 'nearby', label: '주변 시설 보기', onSelect: () => undefined },
    ],
  },
  argTypes: {
    actions: { control: false },
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
    actions: [{ id: 'select', label: '이 위치로 정하기', onSelect: () => undefined }],
  },
};

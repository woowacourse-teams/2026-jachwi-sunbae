import type { Meta, StoryObj } from '@storybook/react-webpack5';

import MapCoordinateMenu from './MapCoordinateMenu';

const meta = {
  title: '기능/지도/MapCoordinateMenu',
  component: MapCoordinateMenu,
  args: {
    menu: {
      latitude: 37.4842,
      longitude: 126.9297,
      actions: [
        { id: 'memo', label: '거리 메모 남기기', onSelect: () => undefined },
        { id: 'nearby', label: '주변 시설 보기', onSelect: () => undefined },
      ],
      onClose: () => undefined,
    },
  },
  argTypes: {
    menu: { control: false },
  },
} satisfies Meta<typeof MapCoordinateMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomTitle: Story = {
  args: {
    menu: {
      latitude: 37.4842,
      longitude: 126.9297,
      title: '서울 관악구 신림동 1422',
      actions: [{ id: 'select', label: '이 위치로 정하기', onSelect: () => undefined }],
      onClose: () => undefined,
    },
  },
};

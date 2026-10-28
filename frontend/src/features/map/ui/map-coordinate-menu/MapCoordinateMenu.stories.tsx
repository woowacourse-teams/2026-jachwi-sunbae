import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import MapCoordinateMenu from './MapCoordinateMenu';

const meta = {
  title: '기능/지도/MapCoordinateMenu',
  component: MapCoordinateMenu,
  args: {
    menu: {
      latitude: 37.4842,
      longitude: 126.9297,
      actions: [
        { id: 'memo', label: '거리 메모 남기기', onSelect: fn() },
        { id: 'nearby', label: '주변 시설 보기', onSelect: fn() },
      ],
      onClose: fn(),
    },
  },
  argTypes: {
    menu: {
      control: false,
      description:
        '찍은 좌표와 말풍선 제목·동작 목록. 함수가 들어 있어 컨트롤로 고치지 않는다. 동작의 onSelect와 onClose는 Actions 패널에 찍힌다.',
    },
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
      actions: [{ id: 'select', label: '이 위치로 정하기', onSelect: fn() }],
      onClose: fn(),
    },
  },
};

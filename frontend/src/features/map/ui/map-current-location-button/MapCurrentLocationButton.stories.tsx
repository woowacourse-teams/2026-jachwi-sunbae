import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import MapCurrentLocationButton from './MapCurrentLocationButton';

const meta = {
  title: '기능/지도/MapCurrentLocationButton',
  component: MapCurrentLocationButton,
  args: {
    isLocating: false,
    onClick: fn(),
  },
  argTypes: {
    isLocating: { description: '현재 위치를 찾는 중. 버튼이 돌아가는 모양이 된다.' },
    onClick: { description: '버튼을 눌렀을 때' },
  },
} satisfies Meta<typeof MapCurrentLocationButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Locating: Story = {
  args: {
    isLocating: true,
  },
};

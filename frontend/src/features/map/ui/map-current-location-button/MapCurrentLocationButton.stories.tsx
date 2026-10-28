import type { Meta, StoryObj } from '@storybook/react-webpack5';

import MapCurrentLocationButton from './MapCurrentLocationButton';

const meta = {
  title: '기능/지도/MapCurrentLocationButton',
  component: MapCurrentLocationButton,
  args: {
    isLocating: false,
    onClick: () => undefined,
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

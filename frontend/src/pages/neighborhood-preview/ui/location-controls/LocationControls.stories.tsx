import type { Meta, StoryObj } from '@storybook/react-webpack5';

import LocationControls from './LocationControls';

const meta = {
  title: '페이지/동네 찾기/LocationControls',
  component: LocationControls,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: '24rem', maxWidth: '26rem', background: '#e9ece8' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    preview: {
      isLocating: false,
      locationError: null,
      moveToCurrentLocation: () => Promise.resolve(),
    },
    isResult: false,
    isFilterOpen: false,
  },
} satisfies Meta<typeof LocationControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Locating: Story = {
  args: {
    preview: { ...meta.args.preview, isLocating: true },
  },
};

export const WithError: Story = {
  args: {
    preview: { ...meta.args.preview, locationError: '위치 권한을 허용해 주세요.' },
  },
};

export const OnResult: Story = {
  args: {
    isResult: true,
  },
};

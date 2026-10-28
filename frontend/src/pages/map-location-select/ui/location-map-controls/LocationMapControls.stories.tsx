import type { Meta, StoryObj } from '@storybook/react-webpack5';

import LocationMapControls from './LocationMapControls';

const meta = {
  title: '페이지/위치 선택/LocationMapControls',
  component: LocationMapControls,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: '12rem', maxWidth: '24rem', background: '#eef0ea' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    isLocating: false,
    onOpenSearch: () => undefined,
    onMoveToCurrentLocation: () => undefined,
  },
} satisfies Meta<typeof LocationMapControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Locating: Story = {
  args: {
    isLocating: true,
  },
};

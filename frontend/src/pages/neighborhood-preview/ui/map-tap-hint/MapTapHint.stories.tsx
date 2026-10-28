import type { Meta, StoryObj } from '@storybook/react-webpack5';

import MapTapHint from './MapTapHint';

const meta = {
  title: '페이지/동네 찾기/공통/MapTapHint',
  component: MapTapHint,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: '14rem', maxWidth: '26rem', background: '#e9ece8' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MapTapHint>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

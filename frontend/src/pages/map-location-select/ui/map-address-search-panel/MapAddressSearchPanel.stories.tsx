import type { Meta, StoryObj } from '@storybook/react-webpack5';

import MapAddressSearchPanel from './MapAddressSearchPanel';

const meta = {
  title: '페이지/위치 선택/MapAddressSearchPanel',
  component: MapAddressSearchPanel,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: '24rem', maxWidth: '24rem', background: '#eef0ea' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    isOpen: true,
    onClose: () => undefined,
    onSelect: () => undefined,
  },
} satisfies Meta<typeof MapAddressSearchPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

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
  argTypes: {
    isOpen: { description: '검색 패널을 열지. 닫으면 아무것도 그리지 않는다.' },
    onClose: { description: '패널 닫기' },
    onSelect: { description: '검색 결과에서 주소 하나를 골랐을 때' },
  },
  args: {
    isOpen: true,
    onClose: fn(),
    onSelect: fn(),
  },
} satisfies Meta<typeof MapAddressSearchPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

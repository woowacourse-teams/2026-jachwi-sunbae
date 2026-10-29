import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import ListingLink from './ListingLink';

const meta = {
  title: '페이지/동네 찾기/공통/ListingLink',
  component: ListingLink,
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    areaName: { description: '버튼 문구에 들어갈 동네 이름' },
    center: { control: 'object', description: '다방 지도를 열 좌표' },
    onOpen: { description: '링크를 열 때 부르는 콜백' },
  },
  args: {
    areaName: '망원1동',
    center: { latitude: 37.5559, longitude: 126.9019 },
    onOpen: fn(),
  },
} satisfies Meta<typeof ListingLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

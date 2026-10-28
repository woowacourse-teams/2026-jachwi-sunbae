import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ListingLink from './ListingLink';

const meta = {
  title: '페이지/동네 찾기/ListingLink',
  component: ListingLink,
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    areaName: '망원1동',
    center: { latitude: 37.5559, longitude: 126.9019 },
    onOpen: () => undefined,
  },
} satisfies Meta<typeof ListingLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import NeighborhoodMapSearch from './NeighborhoodMapSearch';

const meta = {
  title: '페이지/동네 찾기/NeighborhoodMapSearch',
  component: NeighborhoodMapSearch,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: '10rem', maxWidth: '26rem', background: '#e9ece8' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    preview: {
      leave: () => undefined,
      query: '',
      changeQuery: () => undefined,
      searchDestination: () => Promise.resolve(),
      shouldFocusMapSearch: false,
    },
  },
} satisfies Meta<typeof NeighborhoodMapSearch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithQuery: Story = {
  args: {
    preview: { ...meta.args.preview, query: '서울특별시청' },
  },
};

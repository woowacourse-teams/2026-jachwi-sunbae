import type { Meta, StoryObj } from '@storybook/react-webpack5';

import HorizontalRail from './HorizontalRail';

const neighborhoods = ['신림동', '봉천동', '서교동', '연남동', '성수동', '자양동'];

const cardStyle = {
  flex: '0 0 10rem',
  height: '7rem',
  padding: '1rem',
  borderRadius: '1rem',
  background: '#eef4ff',
  fontWeight: 700,
};

const meta = {
  title: '공용/HorizontalRail',
  component: HorizontalRail,
  argTypes: {
    children: { control: false },
  },
  args: {
    'aria-label': '동네 TOP5',
    children: neighborhoods.map((name, index) => (
      <div key={name} style={cardStyle}>
        {index + 1}. {name}
      </div>
    )),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HorizontalRail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FewCards: Story = {
  args: {
    children: neighborhoods.slice(0, 2).map((name) => (
      <div key={name} style={cardStyle}>
        {name}
      </div>
    )),
  },
};

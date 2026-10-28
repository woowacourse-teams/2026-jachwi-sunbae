import type { Meta, StoryObj } from '@storybook/react-webpack5';

import WeatherSymbol from './WeatherSymbol';

const meta = {
  title: '기능/날씨/WeatherSymbol',
  component: WeatherSymbol,
  args: {
    hour: { sky: 1, pty: 0 },
    size: 40,
  },
  argTypes: {
    hour: { control: 'object' },
  },
} satisfies Meta<typeof WeatherSymbol>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sunny: Story = {};

export const Cloudy: Story = {
  args: {
    hour: { sky: 4, pty: 0 },
  },
};

export const Rain: Story = {
  args: {
    hour: { sky: 4, pty: 1 },
  },
};

export const Snow: Story = {
  args: {
    hour: { sky: 4, pty: 3 },
  },
};

export const NoData: Story = {
  args: {
    hour: { sky: null, pty: null },
  },
};

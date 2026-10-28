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
    hour: {
      control: 'object',
      description:
        '기상청 하늘 상태(sky 1 맑음·3 구름 많음·4 흐림)와 강수 형태(pty 0 없음·1 비·2 비/눈·3 눈·4 소나기). 둘 다 null이면 자료 없음.',
    },
    size: { control: { type: 'range', min: 16, max: 96, step: 4 }, description: '아이콘 크기(px)' },
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

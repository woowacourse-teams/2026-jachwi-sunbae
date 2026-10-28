import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { ComponentProps } from 'react';

import HorizontalRail from './HorizontalRail';

const neighborhoods = ['신림동', '봉천동', '서교동', '연남동', '성수동', '자양동', '역삼동', '합정동'];

const cardStyle = {
  flex: '0 0 10rem',
  height: '7rem',
  padding: '1rem',
  borderRadius: '1rem',
  background: '#eef4ff',
  fontWeight: 700,
};

/** 카드는 스토리가 그리므로 몇 장 넣을지를 컨트롤로 바꾼다. */
type HorizontalRailStoryArgs = ComponentProps<typeof HorizontalRail> & {
  cardCount: number;
  showRank: boolean;
};

const meta: Meta<HorizontalRailStoryArgs> = {
  title: '공용/HorizontalRail',
  component: HorizontalRail,
  argTypes: {
    children: { control: false, table: { disable: true } },
    'aria-label': { control: 'text', description: '레일을 화면 낭독기가 읽는 이름' },
    cardCount: {
      control: { type: 'range', min: 1, max: neighborhoods.length, step: 1 },
      description: '(스토리 전용) 레일에 넣을 카드 수',
    },
    showRank: { control: 'boolean', description: '(스토리 전용) 카드 이름 앞에 순위를 붙일지' },
  },
  args: {
    'aria-label': '동네 TOP5',
    cardCount: 6,
    showRank: true,
  },
  render: ({ cardCount, showRank, ...args }) => (
    <HorizontalRail {...args}>
      {neighborhoods.slice(0, cardCount).map((name, index) => (
        <div key={name} style={cardStyle}>
          {showRank && `${index + 1}. `}
          {name}
        </div>
      ))}
    </HorizontalRail>
  ),
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<HorizontalRailStoryArgs>;

export const Default: Story = {};

export const FewCards: Story = {
  args: {
    cardCount: 2,
    showRank: false,
  },
};

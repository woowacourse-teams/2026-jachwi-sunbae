import { css } from '@emotion/css';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import RankedCard from './RankedCard';

const meta = {
  title: '공용/RankedCard',
  component: RankedCard,
  parameters: { layout: 'padded' },
  args: {
    rank: 1,
    title: '역삼1동',
    value: 3,
    unit: '분',
    description: '역삼역에서 출발',
    selected: false,
    disabled: false,
    onSelect: fn(),
  },
  argTypes: {
    rank: { control: 'inline-radio', options: [1, 2, 3, 4, 5], description: '순위. 숫자 대신 메달 그림으로 보인다.' },
    title: { description: '카드 제목(동네 이름 등)' },
    value: { control: 'text', description: '크게 보여 줄 값' },
    unit: { description: '값 뒤에 붙는 단위' },
    description: { description: '값 아래 작은 설명' },
    onSelect: { control: false },
  },
} satisfies Meta<typeof RankedCard>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Price: Story = {
  args: { rank: 2, title: '신림동', value: 55, unit: '만원', description: '월세 참고 가격' },
};
export const Disabled: Story = { args: { disabled: true } };
/** 순위 1~5를 한꺼번에. 순위 외의 값은 컨트롤이 그대로 반영된다. */
export const AllRanks: Story = {
  argTypes: { rank: { control: false } },
  render: (args) => (
    <div className={styles.row}>
      {([1, 2, 3, 4, 5] as const).map((rank) => (
        <RankedCard key={rank} {...args} rank={rank} />
      ))}
    </div>
  ),
};

const styles = {
  row: css`
    label: RankedCard.stories-row;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  `,
};

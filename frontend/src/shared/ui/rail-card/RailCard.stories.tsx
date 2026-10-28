import { css } from '@emotion/css';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import HorizontalRail from '../horizontal-rail/HorizontalRail';
import RailCard from './RailCard';

const styles = {
  sample: css`
    label: RailCard.stories-sample;
    flex: 0 0 9rem;
    padding: 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-tile);
    background: var(--color-surface);
  `,
};

// to/onSelect 유니언 props라 satisfies 대신 타입을 직접 지정한다.
const meta: Meta<typeof RailCard> = {
  title: '공용/RailCard',
  component: RailCard,
  decorators: [
    (Story) => (
      <HorizontalRail aria-label="예시 레일">
        <Story />
      </HorizontalRail>
    ),
  ],
  args: {
    className: styles.sample,
    children: '내용은 쓰는 쪽에서 그려요',
    selected: false,
    disabled: false,
    onSelect: fn(),
  },
  argTypes: {
    children: { control: 'text', description: '카드 안의 내용' },
    to: { control: 'text', description: '이동할 주소. 주면 링크로, 비우고 `onSelect`를 주면 선택 버튼으로 그린다.' },
    selected: { control: 'boolean', description: '선택 버튼일 때 고른 상태' },
    disabled: { control: 'boolean', description: '선택 버튼일 때 누를 수 없게 한다.' },
    state: { control: 'object' },
    onSelect: { control: false },
  },
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof RailCard>;

export const Select: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Navigate: Story = {
  args: { onSelect: undefined, selected: undefined, disabled: undefined, to: '/properties/1' },
};

import { css } from '@emotion/css';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

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
  args: { className: styles.sample, children: '내용은 쓰는 쪽에서 그려요', onSelect: () => {} },
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof RailCard>;

export const Select: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Navigate: Story = { args: { onSelect: undefined, to: '/properties/1' } };

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { DEFAULT_COMPARE_FILTERS } from '../../lib/compareFilters';
import CompareFilters from './CompareFilters';

const meta = {
  title: '페이지/방 비교/CompareFilters',
  component: CompareFilters,
  args: {
    filters: DEFAULT_COMPARE_FILTERS,
    resultCount: 6,
    onChange: () => undefined,
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof CompareFilters>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filtered: Story = {
  args: {
    filters: { query: '역삼', rentLimit: 70, checklist: 'started' },
    resultCount: 2,
  },
};

export const NoResult: Story = {
  args: {
    filters: { query: '없는 매물', rentLimit: 50, checklist: 'notStarted' },
    resultCount: 0,
  },
};

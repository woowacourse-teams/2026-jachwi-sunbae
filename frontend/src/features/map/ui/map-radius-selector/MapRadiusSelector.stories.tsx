import type { Meta, StoryObj } from '@storybook/react-webpack5';

import MapRadiusSelector from './MapRadiusSelector';

const meta: Meta<typeof MapRadiusSelector<number>> = {
  title: '기능/지도/MapRadiusSelector',
  component: MapRadiusSelector,
  args: {
    label: '주변 시설 반경',
    options: [
      { value: 500, label: '500m', isSelected: true },
      { value: 1000, label: '1km', isSelected: false },
      { value: 2000, label: '2km', isSelected: false },
    ],
    onSelect: () => undefined,
    disabled: false,
  },
  argTypes: {
    options: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '20rem', height: '8rem', background: '#e9e5d8' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

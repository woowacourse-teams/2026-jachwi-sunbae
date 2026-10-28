import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

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
    onSelect: fn(),
    disabled: false,
  },
  argTypes: {
    label: { description: '선택 묶음의 접근성 이름' },
    options: { control: 'object', description: '반경 선택지. isSelected가 true인 칸이 눌린 모양이 된다.' },
    disabled: { description: '모든 선택지를 막는다.' },
    onSelect: { description: '선택지를 눌렀을 때. 누른 값을 넘긴다.' },
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

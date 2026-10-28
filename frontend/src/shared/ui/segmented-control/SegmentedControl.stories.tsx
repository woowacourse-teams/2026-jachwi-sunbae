import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import { SegmentedControl, SegmentedControlItem } from './SegmentedControl';

const meta = {
  title: '공용/SegmentedControl',
  component: SegmentedControl,
  args: {
    'aria-label': '최대 환승 횟수',
    value: '1',
    disabled: false,
    onValueChange: fn(),
    children: null,
  },
  argTypes: {
    'aria-label': { description: '묶음을 화면 낭독기가 읽는 이름' },
    value: { control: 'inline-radio', options: ['0', '1', '2'], description: '고른 칸의 값' },
    disabled: { description: '모든 칸을 막는다' },
    onValueChange: { control: false },
    children: { control: false },
  },
  // 고른 값을 args에 되돌려 써서 컨트롤 패널과 화면이 같은 값을 보게 한다.
  render: function ControlledSegmentedControl(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <SegmentedControl
        {...args}
        onValueChange={(value) => {
          args.onValueChange(value);
          updateArgs({ value });
        }}
      >
        <SegmentedControlItem value="0">환승 없음</SegmentedControlItem>
        <SegmentedControlItem value="1">1회 이하</SegmentedControlItem>
        <SegmentedControlItem value="2">2회 이하</SegmentedControlItem>
      </SegmentedControl>
    );
  },
} satisfies Meta<typeof SegmentedControl>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

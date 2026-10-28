import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import WheelPicker from './WheelPicker';

const options = Array.from({ length: 6 }, (_, index) => ({
  value: (index + 1) * 10,
  label: `${(index + 1) * 10}분 이내`,
}));

const meta = {
  title: '공용/WheelPicker',
  component: WheelPicker,
  args: {
    'aria-label': '통근 시간',
    value: 60,
    options,
    onValueChange: fn(),
  },
  argTypes: {
    'aria-label': { description: '목록을 화면 낭독기가 읽는 이름' },
    value: {
      control: 'select',
      options: options.map((option) => option.value),
      description: '고른 값. 굴려서 고르면 컨트롤 값도 함께 바뀐다.',
    },
    options: { control: 'object', description: '고를 수 있는 값과 보이는 이름 목록' },
    size: {
      control: 'inline-radio',
      options: ['medium', 'small'],
      description: 'small은 카드 안에 바로 펼칠 때 쓰는 낮은 높이(위아래 한 칸씩)',
    },
    onValueChange: { control: false },
  },
  // 고른 값을 args에 되돌려 써서 컨트롤 패널과 화면이 같은 값을 보게 한다.
  render: function ControlledWheelPicker(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <WheelPicker
        {...args}
        onValueChange={(value) => {
          args.onValueChange(value);
          updateArgs({ value });
        }}
      />
    );
  },
} satisfies Meta<typeof WheelPicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

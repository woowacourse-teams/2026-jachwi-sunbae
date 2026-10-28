import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import Slider from './Slider';

const meta = {
  title: '공용/Slider',
  component: Slider,
  args: {
    label: '월세 시세',
    indicator: '50만원 이하',
    description: '최근 6개월 실거래 월세 중앙값으로 걸러요.',
    markers: [
      { value: 0, label: '전체' },
      { value: 100, label: '100만원 이하' },
    ],
    min: 0,
    max: 100,
    step: 10,
    values: [50],
    disabled: false,
    onValuesChange: fn(),
    getAriaLabel: () => '최대 월세 시세',
  },
  argTypes: {
    label: { description: '위 왼쪽 제목' },
    indicator: { description: '위 오른쪽 현재 값 표시' },
    description: { description: '아래 보조 설명' },
    markers: { control: 'object', description: '막대 아래 눈금 글자' },
    values: { control: 'object', description: '고른 값. 손잡이 하나라 첫 값만 쓴다.' },
    onValuesChange: { control: false },
    getAriaLabel: { control: false },
  },
  // 고른 값을 args에 되돌려 써서 컨트롤 패널과 화면이 같은 값을 보게 한다.
  render: function ControlledSlider(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <Slider
        {...args}
        indicator={`${args.values[0] ?? 0}만원 이하`}
        onValuesChange={(values) => {
          args.onValuesChange(values);
          updateArgs({ values });
        }}
      />
    );
  },
} satisfies Meta<typeof Slider>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

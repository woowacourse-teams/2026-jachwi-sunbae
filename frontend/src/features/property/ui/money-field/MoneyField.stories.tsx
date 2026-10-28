import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import MoneyField from './MoneyField';

const meta = {
  title: '기능/매물/MoneyField',
  component: MoneyField,
  args: {
    id: 'story-deposit',
    label: '보증금',
    requirement: '필수',
    placeholder: '0',
    value: '1,000',
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    label: { description: '칸 위 이름' },
    requirement: { control: 'inline-radio', options: ['필수', '선택'], description: '이름 옆 필수·선택 표시' },
    value: { description: '천 단위 쉼표가 붙은 금액(만 원). 입력하면 이 값도 함께 바뀐다.' },
    placeholder: { description: '비어 있을 때 보이는 안내' },
    error: { control: 'text', description: '오류 문구. 있으면 칸이 오류 모양이 된다.' },
    helpText: { control: 'text', description: '칸 아래 도움말' },
    disabled: { description: '입력을 막는다.' },
    onValueChange: { description: '숫자를 입력할 때. 쉼표를 붙인 값을 넘긴다.' },
    labelSuffix: { control: false },
  },
  /** 입력한 값을 args에 되돌려 넣어 컨트롤 패널의 value와 화면이 같이 움직이게 한다. */
  render: function Render(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <MoneyField
        {...args}
        onValueChange={(formatted) => {
          args.onValueChange(formatted);
          updateArgs({ value: formatted });
        }}
      />
    );
  },
  decorators: [
    (Story) => (
      <div style={{ width: '20rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MoneyField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    value: '',
  },
};

export const WithError: Story = {
  args: {
    value: '',
    error: '보증금을 입력해 주세요.',
  },
};

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import TextField from './TextField';

const meta = {
  title: '공용/TextField',
  component: TextField,
  args: {
    label: '매물 이름',
    value: '',
    placeholder: '매물 이름 입력',
    floatingLabel: true,
    variant: 'underline',
    fieldSize: 'medium',
    disabled: false,
    onChange: fn(),
  },
  argTypes: {
    label: { description: '입력칸 라벨' },
    value: { control: 'text', description: '입력한 값. 입력하면 컨트롤 값도 함께 바뀐다.' },
    placeholder: { control: 'text' },
    type: { control: 'select', options: ['text', 'number', 'tel', 'email', 'search', 'password'] },
    maxLength: { control: { type: 'number', min: 1 } },
    disabled: { control: 'boolean' },
    requirement: {
      control: 'inline-radio',
      options: ['필수', '선택'],
      description: '`필수`면 라벨 앞에 * 표시를 붙인다.',
    },
    helpText: { control: 'text', description: '입력칸 아래 도움말' },
    error: { control: 'text', description: '오류 문구. 주면 입력칸을 오류 상태로 표시한다.' },
    suffix: { control: 'text', description: '입력칸 오른쪽 끝 단위 등(예: 만원)' },
    labelSuffix: { control: 'text', description: '라벨 뒤에 붙는 내용' },
    variant: {
      control: 'inline-radio',
      options: ['filled', 'underline', 'box'],
    },
    fieldSize: {
      control: 'inline-radio',
      options: ['medium', 'large'],
    },
    floatingLabel: { control: 'boolean' },
    fieldClassName: { control: false },
    onChange: { control: false },
  },
  // 입력한 값을 args에 되돌려 써서 컨트롤 패널과 입력칸이 같은 값을 보게 한다.
  render: function ControlledTextField(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <TextField
        {...args}
        onChange={(event) => {
          args.onChange?.(event);
          updateArgs({ value: event.target.value });
        }}
      />
    );
  },
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: {
    requirement: '필수',
  },
};

export const WithHelpAndError: Story = {
  args: {
    value: '입력한 값',
    helpText: '30자 이하로 입력해 주세요.',
    error: '이미 사용 중인 이름입니다.',
  },
};

export const WithValue: Story = {
  args: {
    value: '신림역 근처 원룸',
  },
};

export const LargeBox: Story = {
  args: {
    fieldSize: 'large',
    variant: 'box',
  },
};

/** 컴포넌트 기본 모양. 라벨은 칸 위에 고정되어 `floatingLabel`을 쓰지 않는다. */
export const Filled: Story = {
  args: {
    variant: 'filled',
    suffix: '만원',
    label: '월세',
    placeholder: '0',
    type: 'number',
  },
};

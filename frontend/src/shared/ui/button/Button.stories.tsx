import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import Icon from '../icon/Icon';
import { Button, ButtonLink } from './Button';

const meta = {
  title: '공용/Button',
  component: Button,
  args: {
    children: '저장하기',
    variant: 'primary',
    size: 'medium',
    fullWidth: false,
    disabled: false,
    isLoading: false,
    loadingLabel: '처리 중…',
    onClick: fn(),
  },
  argTypes: {
    children: { control: 'text', description: '버튼 문구' },
    variant: {
      control: 'select',
      options: ['primary', 'soft', 'secondary', 'neutral', 'danger', 'text'],
      description: '색과 모양. 한 화면의 주 행동은 `primary`, 지우기처럼 되돌릴 수 없는 행동은 `danger`를 쓴다.',
    },
    size: { control: 'inline-radio', options: ['medium', 'large'] },
    fullWidth: { control: 'boolean', description: '부모 너비를 가득 채울지' },
    disabled: { control: 'boolean' },
    isLoading: { control: 'boolean', description: '켜면 스피너와 `loadingLabel`을 보여 주고 누를 수 없게 한다.' },
    loadingLabel: { control: 'text', description: '처리 중일 때 문구 대신 보여 줄 글자' },
    type: { control: 'inline-radio', options: ['button', 'submit', 'reset'] },
    onClick: { control: false },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Large: Story = {
  args: {
    size: 'large',
    children: '카카오로 시작하기',
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    loadingLabel: '저장 중…',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Danger: Story = {
  args: {
    children: '삭제하기',
    variant: 'danger',
  },
};

/** 같은 모양의 링크(`ButtonLink`). 모양 컨트롤(variant·size·fullWidth)만 반영된다. */
export const Link: Story = {
  render: ({ children, variant, size, fullWidth }) => (
    <ButtonLink to="/" variant={variant} size={size} fullWidth={fullWidth}>
      <Icon name="plus" size={15} />
      {children}
    </ButtonLink>
  ),
  args: {
    children: '매물 목록으로 이동',
    variant: 'secondary',
  },
};

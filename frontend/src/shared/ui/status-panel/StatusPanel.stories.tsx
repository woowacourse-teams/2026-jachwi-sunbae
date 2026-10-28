import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '../button/Button';
import StatusPanel from './StatusPanel';

/** 안내 아래 행동 버튼. 값은 이름으로 두고 그릴 때 요소로 바꾼다. */
const actions = {
  없음: undefined,
  '다시 로그인 버튼': <Button>다시 로그인하기</Button>,
};

const meta = {
  title: '공용/StatusPanel',
  component: StatusPanel,
  argTypes: {
    title: { description: '안내 제목' },
    description: { description: '제목 아래 설명' },
    tone: {
      control: 'inline-radio',
      options: ['neutral', 'error', 'success'],
      description: '`error`는 그림, `success`는 체크 표시로 바뀐다.',
    },
    isBusy: { description: '켜면 표시 자리에 스피너를 돌리고 진행 중으로 알린다.' },
    action: { control: 'inline-radio', options: Object.keys(actions), mapping: actions },
  },
  args: {
    title: '로그인을 확인하고 있어요',
    description: '잠시만 기다려 주세요.',
    tone: 'neutral',
    isBusy: false,
    action: '없음',
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof StatusPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Busy: Story = {
  args: {
    isBusy: true,
  },
};

export const Success: Story = {
  args: {
    tone: 'success',
    title: '로그인했어요',
    description: '곧 홈 화면으로 이동해요.',
  },
};

export const WithError: Story = {
  args: {
    tone: 'error',
    title: '로그인하지 못했어요',
    description: '카카오 로그인이 취소되었거나 시간이 지났어요. 다시 시도해 주세요.',
    action: '다시 로그인 버튼',
  },
};

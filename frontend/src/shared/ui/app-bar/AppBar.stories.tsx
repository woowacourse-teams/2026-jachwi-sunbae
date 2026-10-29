import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import AppBar from './AppBar';

// backTo/onBack 유니언 props라 satisfies 대신 타입을 직접 지정한다.
const meta: Meta<typeof AppBar> = {
  title: '공용/AppBar',
  component: AppBar,
  args: {
    title: '개인정보 처리방침',
    backLabel: '이전 화면으로 돌아가기',
    backTo: '/',
  },
  argTypes: {
    backLabel: { description: '뒤로 가기 버튼을 화면 낭독기가 읽는 이름' },
    backTo: { control: 'text', description: '뒤로 가기 링크 주소. 비우고 `onBack`을 주면 버튼으로 그린다.' },
    onBack: { control: false, description: '뒤로 가기 버튼을 눌렀을 때 부르는 함수' },
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof AppBar>;

export const WithTitle: Story = {};

export const BackOnly: Story = {
  args: { title: undefined },
};

export const WithBackAction: Story = {
  args: { title: '사진 관리', backLabel: '매물 상세로 돌아가기', backTo: undefined, onBack: fn() },
};

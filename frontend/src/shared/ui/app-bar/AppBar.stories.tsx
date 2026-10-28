import type { Meta, StoryObj } from '@storybook/react-webpack5';

import AppBar from './AppBar';

const meta: Meta<typeof AppBar> = {
  title: '공용/AppBar',
  component: AppBar,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

/* 뒤로 가기 props가 `backTo`·`onBack` 중 하나만 받는 유니언이라 args 대신 직접 그린다. */
export const WithTitle: Story = {
  render: () => <AppBar title="개인정보 처리방침" backLabel="이전 화면으로 돌아가기" backTo="/" />,
};

export const BackOnly: Story = {
  render: () => <AppBar backLabel="이전 화면으로 돌아가기" backTo="/" />,
};

export const WithBackAction: Story = {
  render: () => <AppBar title="사진 관리" backLabel="매물 상세로 돌아가기" onBack={() => undefined} />,
};

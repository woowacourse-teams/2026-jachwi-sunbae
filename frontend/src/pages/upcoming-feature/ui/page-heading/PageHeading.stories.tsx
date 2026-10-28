import type { Meta, StoryObj } from '@storybook/react-webpack5';

import PageHeading from './PageHeading';

const meta = {
  title: '페이지/준비 중 기능/PageHeading',
  component: PageHeading,
  args: {
    title: '준비 중인 기능이에요',
    description: '더 편하게 쓸 수 있도록 다듬고 있어요. 조금만 기다려 주세요.',
  },
  argTypes: {
    title: { description: '화면 제목(h1)' },
    description: { description: '제목 아래 설명. 비우면 그리지 않는다.' },
    backTo: { description: '뒤로 가기 링크 주소. 비우면 링크를 그리지 않는다.' },
    backLabel: { description: '뒤로 가기 링크 문구' },
    focusOnMount: { description: '처음 그릴 때 제목에 초점을 옮길지' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PageHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithBackLink: Story = {
  args: {
    backTo: '/',
    backLabel: '홈으로',
  },
};

export const TitleOnly: Story = {
  args: {
    description: undefined,
  },
};

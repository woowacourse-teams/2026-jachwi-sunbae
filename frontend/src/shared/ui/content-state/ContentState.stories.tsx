import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ContentState from './ContentState';

const meta = {
  title: '공용/ContentState',
  component: ContentState,
  argTypes: {
    tone: {
      control: 'select',
      options: ['info', 'error'],
    },
    children: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ContentState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    loading: true,
    title: '매물 정보를 불러오는 중이에요.',
  },
};

export const WithError: Story = {
  args: {
    tone: 'error',
    title: '매물 정보를 불러오지 못했어요.',
    description: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
    onRetry: () => undefined,
  },
};

export const Info: Story = {
  args: {
    title: '주소가 올바르지 않아요.',
    description: '홈에서 다시 매물을 선택해 주세요.',
  },
};

export const Inline: Story = {
  args: {
    page: false,
    tone: 'error',
    title: '체크리스트를 불러오지 못했어요.',
    description: '잠시 후 다시 시도해 주세요.',
    onRetry: () => undefined,
  },
  parameters: {
    layout: 'padded',
  },
};

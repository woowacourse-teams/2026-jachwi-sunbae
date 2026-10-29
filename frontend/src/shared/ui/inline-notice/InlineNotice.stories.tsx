import type { Meta, StoryObj } from '@storybook/react-webpack5';

import InlineNotice from './InlineNotice';

const meta = {
  title: '공용/InlineNotice',
  component: InlineNotice,
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['info', 'warning', 'error'],
      description: '색. `error`는 경고(alert)로 바로 읽어 준다.',
    },
    children: { control: 'text', description: '안내 문구' },
  },
  args: {
    children: '입력한 정보는 이 기기에만 저장돼요.',
    tone: 'info',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InlineNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = {};

export const Warning: Story = {
  args: {
    tone: 'warning',
    children: '방문 일정이 지났어요. 일정을 다시 확인해 주세요.',
  },
};

export const WithError: Story = {
  args: {
    tone: 'error',
    children: '부가 정보를 저장하지 못했어요. 다시 시도해 주세요.',
  },
};

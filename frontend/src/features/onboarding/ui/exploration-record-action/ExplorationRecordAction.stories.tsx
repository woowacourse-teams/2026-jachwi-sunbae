import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ExplorationRecordAction from './ExplorationRecordAction';

const meta = {
  title: '기능/온보딩/ExplorationRecordAction',
  component: ExplorationRecordAction,
  args: {
    location: {
      address: '서울 관악구 신림동 1422',
      roadAddress: '서울 관악구 신림로 330',
      jibunAddress: '서울 관악구 신림동 1422',
      latitude: 37.4842,
      longitude: 126.9297,
    },
  },
  argTypes: {
    location: {
      control: 'object',
      description: '기록할 동네 위치. 누르면 이 위치를 저장해 두고 로그인 화면으로 간다.',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '22rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ExplorationRecordAction>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

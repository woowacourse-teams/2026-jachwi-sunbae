import type { Meta, StoryObj } from '@storybook/react-webpack5';

import RecordsAddBar from './RecordsAddBar';

const coordinate = { latitude: 37.5006, longitude: 127.0364 };

const meta = {
  title: '페이지/본 방 기록/RecordsAddBar',
  component: RecordsAddBar,
  args: {
    kind: 'memo',
    coordinate: null,
    address: null,
    status: 'idle',
    onCancel: () => undefined,
    onConfirm: () => undefined,
  },
  argTypes: {
    kind: { control: 'radio', options: ['memo', 'property'] },
    status: { control: 'radio', options: ['idle', 'loading', 'error'] },
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      // 휴대폰 지도 위에 띄우는 안내와 버튼이라 지도 크기의 칸 안에 둔다.
      <div style={{ position: 'relative', width: '24rem', height: '36rem', background: '#e8efe4' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecordsAddBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MemoGuide: Story = {};

export const PropertyLoadingAddress: Story = {
  args: {
    kind: 'property',
    coordinate,
    status: 'loading',
  },
};

export const PropertyWithAddress: Story = {
  args: {
    kind: 'property',
    coordinate,
    address: {
      address: '서울 강남구 테헤란로 152',
      roadAddress: '서울 강남구 테헤란로 152',
      jibunAddress: '서울 강남구 역삼동 737',
      ...coordinate,
    },
  },
};

export const PropertyAddressError: Story = {
  args: {
    kind: 'property',
    coordinate,
    status: 'error',
  },
};

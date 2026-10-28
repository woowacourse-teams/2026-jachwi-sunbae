import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import RecordsAddBar from './RecordsAddBar';

const coordinate = { latitude: 37.5006, longitude: 127.0364 };

const meta = {
  title: '페이지/본 방 기록/휴대폰/RecordsAddBar',
  globals: { viewport: { value: 'mobile', isRotated: false } },
  component: RecordsAddBar,
  args: {
    kind: 'memo',
    coordinate: null,
    address: null,
    status: 'idle',
    onCancel: fn(),
    onConfirm: fn(),
  },
  argTypes: {
    kind: { control: 'inline-radio', options: ['memo', 'property'], description: '추가하는 기록 종류(메모·매물)' },
    status: {
      control: 'inline-radio',
      options: ['idle', 'loading', 'error'],
      description: '고른 위치의 주소를 찾는 상태',
    },
    coordinate: { control: 'object', description: '지도에서 고른 위치. 비우면(null) 위치를 고르라는 안내만 보인다.' },
    address: { control: 'object', description: '고른 위치의 주소 검색 결과' },
    onCancel: { description: '추가 모드를 끝낼 때 부른다.' },
    onConfirm: { description: '고른 위치로 메모·매물을 남길 때 부른다.' },
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

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import type { MapAddress } from '@/features/map/model/Map';

import LocationAddressSheet from './LocationAddressSheet';

const selectedAddress: MapAddress = {
  address: '서울특별시 마포구 와우산로 94',
  roadAddress: '서울특별시 마포구 와우산로 94',
  jibunAddress: '서울특별시 마포구 상수동 72-1',
  latitude: 37.5509,
  longitude: 126.9227,
};

const emptyAddress: MapAddress = {
  address: null,
  roadAddress: null,
  jibunAddress: null,
  latitude: 37.5509,
  longitude: 126.9227,
};

const meta = {
  title: '페이지/위치 선택/LocationAddressSheet',
  component: LocationAddressSheet,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: '20rem', maxWidth: '24rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    selected: {
      control: 'object',
      description: '지도 가운데 핀이 가리키는 주소. 주소가 비면 status에 따라 확인 중·실패 문구를 보여준다.',
    },
    status: {
      control: 'inline-radio',
      options: ['locating', 'geocoding', 'ready', 'error'],
      description: '위치 확인 단계. ready일 때만 확정 버튼을 누를 수 있다.',
    },
    isEditing: { description: '이미 등록한 매물의 위치를 고치는 중인지. 버튼 문구가 바뀐다.' },
    isCreating: { description: '매물을 등록하는 중인지. 등록하는 동안 버튼을 막는다.' },
    hasCreateError: { description: '매물 만들기에 실패했는지.' },
    onOpenSearch: { description: '주소 검색 열기' },
    onConfirm: { description: '이 위치로 확정' },
  },
  args: {
    selected: selectedAddress,
    status: 'ready',
    isEditing: false,
    isCreating: false,
    hasCreateError: false,
    onOpenSearch: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof LocationAddressSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Editing: Story = {
  args: {
    isEditing: true,
  },
};

export const Geocoding: Story = {
  args: {
    selected: emptyAddress,
    status: 'geocoding',
  },
};

export const WithError: Story = {
  args: {
    selected: emptyAddress,
    status: 'error',
  },
};

export const CreateFailed: Story = {
  args: {
    hasCreateError: true,
  },
};

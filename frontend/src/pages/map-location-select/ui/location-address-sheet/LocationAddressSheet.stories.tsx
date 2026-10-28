import type { Meta, StoryObj } from '@storybook/react-webpack5';

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
  args: {
    selected: selectedAddress,
    status: 'ready',
    isEditing: false,
    isCreating: false,
    hasCreateError: false,
    onOpenSearch: () => undefined,
    onConfirm: () => undefined,
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

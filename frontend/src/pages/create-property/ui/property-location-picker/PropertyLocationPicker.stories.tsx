import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { MapAddress } from '@/features/map/model/Map';

import PropertyLocationPicker from './PropertyLocationPicker';

const selectedAddress: MapAddress = {
  address: '서울 관악구 신림로 123',
  roadAddress: '서울 관악구 신림로 123',
  jibunAddress: '서울 관악구 신림동 1422-5',
  latitude: 37.4842,
  longitude: 126.9297,
};

const searchResults: MapAddress[] = [
  selectedAddress,
  {
    address: '서울 관악구 신림로 59',
    roadAddress: '서울 관악구 신림로 59',
    jibunAddress: '서울 관악구 신림동 1640-27',
    latitude: 37.4781,
    longitude: 126.9289,
  },
];

const location = {
  selected: selectedAddress,
  status: 'ready' as const,
  onCenterChange: () => undefined,
  onMoveToCurrentLocation: () => undefined,
};

const search = {
  query: '',
  results: [],
  status: 'idle' as const,
  onQueryChange: () => undefined,
  onSubmit: () => undefined,
  onClear: () => undefined,
  onSelect: () => undefined,
};

const meta = {
  title: '페이지/매물 등록/PropertyLocationPicker',
  component: PropertyLocationPicker,
  argTypes: {
    location: { control: false },
    search: { control: false },
  },
  args: {
    location,
    search,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyLocationPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSearchResults: Story = {
  args: {
    search: { ...search, query: '신림로', results: searchResults },
  },
};

export const Resolving: Story = {
  args: {
    location: { ...location, status: 'loading' },
    search: { ...search, query: '신림로', status: 'loading' },
  },
};

export const WithError: Story = {
  args: {
    location: {
      ...location,
      selected: { ...selectedAddress, address: null, roadAddress: null, jibunAddress: null },
      status: 'error',
    },
    search: { ...search, query: '없는주소 999', status: 'error' },
  },
};

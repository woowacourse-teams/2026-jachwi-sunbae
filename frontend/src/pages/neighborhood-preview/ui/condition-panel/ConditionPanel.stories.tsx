import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ConditionPanel from './ConditionPanel';

const meta = {
  title: '페이지/동네 찾기/ConditionPanel',
  component: ConditionPanel,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '22rem', height: '44rem', display: 'flex' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    preview: {
      hasChosenMapPoint: true,
      mapCandidate: {
        name: '서울특별시청',
        address: '서울특별시 중구 세종대로 110',
        latitude: 37.5663,
        longitude: 126.9779,
      },
      isSearching: false,
      searchError: null,
      addressResults: [],
      selectAddress: () => undefined,
      maxMinutes: 40,
      changeMaxMinutes: () => undefined,
      maxTransfers: 1,
      changeMaxTransfers: () => undefined,
      maxRent: 70,
      changeMaxRent: () => undefined,
      isValidCommuteTime: true,
    },
    disabled: false,
    onSubmit: () => undefined,
  },
} satisfies Meta<typeof ConditionPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoPlaceChosen: Story = {
  args: {
    preview: { ...meta.args.preview, hasChosenMapPoint: false },
  },
};

export const WithAddressResults: Story = {
  args: {
    preview: {
      ...meta.args.preview,
      hasChosenMapPoint: false,
      addressResults: [
        {
          address: '서울특별시 중구 세종대로 110',
          roadAddress: '서울특별시 중구 세종대로 110',
          jibunAddress: '서울특별시 중구 태평로1가 31',
          latitude: 37.5663,
          longitude: 126.9779,
        },
        {
          address: '서울특별시 중구 세종대로 135',
          roadAddress: '서울특별시 중구 세종대로 135',
          jibunAddress: '서울특별시 중구 태평로1가 25',
          latitude: 37.5683,
          longitude: 126.9776,
        },
      ],
    },
  },
};

export const WithSearchError: Story = {
  args: {
    preview: {
      ...meta.args.preview,
      hasChosenMapPoint: false,
      searchError: '검색 결과가 없어요. 주소를 더 자세히 입력해주세요.',
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

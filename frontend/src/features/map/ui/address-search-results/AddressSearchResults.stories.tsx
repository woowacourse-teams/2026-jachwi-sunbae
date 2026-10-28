import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import AddressSearchResults from './AddressSearchResults';

const meta = {
  title: '기능/지도/AddressSearchResults',
  component: AddressSearchResults,
  args: { results: [], status: 'idle', onSelect: fn() },
  argTypes: {
    results: { control: 'object', description: '주소 검색 결과. status가 success일 때 그린다.' },
    status: {
      control: 'inline-radio',
      options: ['idle', 'loading', 'success', 'error'],
      description: '검색 전·검색 중·완료·실패',
    },
    onSelect: { description: '결과 하나를 골랐을 때. 고른 주소를 넘긴다.' },
  },
} satisfies Meta<typeof AddressSearchResults>;
export default meta;
type Story = StoryObj<typeof meta>;
export const BeforeSearch: Story = {};
export const Loading: Story = { args: { status: 'loading' } };
export const Error: Story = { args: { status: 'error' } };
export const Empty: Story = { args: { status: 'success' } };
export const Results: Story = {
  args: {
    status: 'success',
    results: [
      {
        address: '서울특별시 중구 세종대로 110',
        roadAddress: '서울특별시 중구 세종대로 110',
        jibunAddress: '서울특별시 중구 태평로1가 31',
        latitude: 37.5665,
        longitude: 126.978,
      },
    ],
  },
};

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { propertyQueryKeys } from '../../api/propertyQueryKeys';
import type { PropertyPhoto } from '../../model/Property';
import PropertyPhotoCard from './PropertyPhotoCard';

const samplePhoto = new Blob(
  [
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">' +
      '<rect width="300" height="300" fill="#f1ede2"/><rect x="40" y="40" width="120" height="110" fill="#bcd4f0"/>' +
      '<rect x="20" y="200" width="260" height="70" fill="#c9b79c"/></svg>',
  ],
  { type: 'image/svg+xml' },
);

const photo: PropertyPhoto = {
  photoId: 1,
  contentUrl: '/api/properties/10/photos/1/content',
  contentType: 'image/jpeg',
  sizeBytes: 820_000,
  createdAt: '2026-10-20T14:10:00+09:00',
  representative: false,
};

const meta = {
  title: '기능/매물/PropertyPhotoCard',
  component: PropertyPhotoCard,
  args: {
    propertyId: 10,
    photo,
    position: 1,
  },
  argTypes: {
    photo: { control: false },
  },
  parameters: {
    queryData: [[propertyQueryKeys.photoContent(10, 1), samplePhoto]],
  },
  decorators: [
    (Story) => (
      <ul style={{ width: '8rem', margin: 0, padding: 0, listStyle: 'none' }}>
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof PropertyPhotoCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Representative: Story = {
  args: {
    photo: { ...photo, representative: true },
  },
};

/** 사진 내용을 캐시에 넣지 않아 요청이 실패한 대체 화면이 그려진다. */
export const PhotoRequestFailed: Story = {
  parameters: {
    queryData: [],
  },
};

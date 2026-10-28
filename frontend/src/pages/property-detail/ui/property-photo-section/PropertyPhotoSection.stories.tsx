import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { propertyQueryKeys } from '@/features/property/api/propertyQueryKeys';
import type { PropertyPhotoPreview } from '@/features/property/model/Property';

import PropertyPhotoSection from './PropertyPhotoSection';

const photoBlob = (label: string, color: string) =>
  new Blob(
    [
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="${color}"/><text x="320" y="250" font-size="40" text-anchor="middle" fill="#ffffff">${label}</text></svg>`,
    ],
    { type: 'image/svg+xml' },
  );

const photos: PropertyPhotoPreview[] = [
  { photoId: 101, contentUrl: '/api/properties/10/photos/101/content', createdAt: '2026-10-20T14:31:00' },
  { photoId: 102, contentUrl: '/api/properties/10/photos/102/content', createdAt: '2026-10-20T14:32:00' },
  { photoId: 103, contentUrl: '/api/properties/10/photos/103/content', createdAt: '2026-10-20T14:33:00' },
];

const photoQueryData = [
  [propertyQueryKeys.photoContent(10, 101), photoBlob('거실', '#7a9cc6')],
  [propertyQueryKeys.photoContent(10, 102), photoBlob('주방', '#c69a7a')],
  [propertyQueryKeys.photoContent(10, 103), photoBlob('욕실', '#7ac6a4')],
];

const meta = {
  title: '페이지/매물 상세/PropertyPhotoSection',
  component: PropertyPhotoSection,
  args: {
    propertyId: 10,
    propertyName: '햇살 좋은 원룸',
    photoPreview: { totalCount: 3, photos },
    onSelect: () => undefined,
  },
  parameters: {
    layout: 'fullscreen',
    queryData: photoQueryData,
  },
} satisfies Meta<typeof PropertyPhotoSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MorePhotos: Story = {
  args: {
    photoPreview: { totalCount: 8, photos },
  },
};

export const Empty: Story = {
  args: {
    photoPreview: { totalCount: 0, photos: [] },
  },
};

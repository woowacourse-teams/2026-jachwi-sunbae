import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { propertyQueryKeys } from '@/features/property/api/propertyQueryKeys';
import type { PropertyPhotoPreview } from '@/features/property/model/Property';

import PropertyHeroPhoto from './PropertyHeroPhoto';

const photoBlob = (label: string, color: string) =>
  new Blob(
    [
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="${color}"/><text x="320" y="250" font-size="40" text-anchor="middle" fill="#ffffff">${label}</text></svg>`,
    ],
    { type: 'image/svg+xml' },
  );

const photos: PropertyPhotoPreview[] = [
  { photoId: 101, contentUrl: '/api/properties/10/photos/101/content', createdAt: '2026-10-20T14:31:00' },
];

const meta = {
  title: '페이지/매물 상세/PropertyHeroPhoto',
  component: PropertyHeroPhoto,
  args: {
    propertyId: 10,
    propertyName: '햇살 좋은 원룸',
    photos,
    backTo: '/properties',
    onOpen: () => undefined,
  },
  parameters: {
    layout: 'fullscreen',
    queryData: [[propertyQueryKeys.photoContent(10, 101), photoBlob('거실', '#7a9cc6')]],
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyHeroPhoto>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithPhoto: Story = {};

export const Empty: Story = {
  args: {
    photos: [],
    backTo: '/',
  },
};

export const WithoutBackButton: Story = {
  args: {
    showBackButton: false,
  },
};

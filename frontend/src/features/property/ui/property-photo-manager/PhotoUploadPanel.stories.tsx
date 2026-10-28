import type { Meta, StoryObj } from '@storybook/react-webpack5';

import PhotoUploadPanel from './PhotoUploadPanel';

const meta = {
  title: '기능/매물/PhotoUploadPanel',
  component: PhotoUploadPanel,
  args: {
    propertyId: 10,
    currentPhotoCount: 3,
  },
  argTypes: {
    propertyId: { control: false, description: '사진을 올릴 매물 ID' },
    currentPhotoCount: {
      control: { type: 'range', min: 0, max: 30, step: 1 },
      description: '이미 올린 사진 수. 30장이면 더 올릴 수 없다는 안내가 나온다.',
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{ display: 'grid', width: '24rem', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.45rem' }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PhotoUploadPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LimitReached: Story = {
  args: {
    currentPhotoCount: 30,
  },
};

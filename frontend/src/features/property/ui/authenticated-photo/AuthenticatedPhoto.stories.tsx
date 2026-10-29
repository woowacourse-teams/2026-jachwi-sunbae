import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { propertyQueryKeys } from '../../api/propertyQueryKeys';
import AuthenticatedPhoto from './AuthenticatedPhoto';

/** 서버에서 받은 사진 대신 쓰는 표본 이미지. 캐시에 넣어 두면 요청 없이 그린다. */
const samplePhoto = new Blob(
  [
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
      '<rect width="400" height="300" fill="#f1ede2"/><rect x="40" y="40" width="150" height="120" fill="#bcd4f0"/>' +
      '<rect x="40" y="200" width="320" height="60" fill="#c9b79c"/><rect x="230" y="70" width="120" height="130" fill="#e3d7c3"/>' +
      '</svg>',
  ],
  { type: 'image/svg+xml' },
);

const meta = {
  title: '기능/매물/AuthenticatedPhoto',
  component: AuthenticatedPhoto,
  args: {
    propertyId: 10,
    photoId: 1,
    contentUrl: '/api/properties/10/photos/1/content',
    alt: '햇살 좋은 원룸 대표 사진',
    errorMode: 'message',
  },
  argTypes: {
    propertyId: { control: false, description: '매물 ID. 표본 사진 캐시가 10번 매물·1번 사진 기준이라 고정한다.' },
    photoId: { control: false, description: '사진 ID' },
    contentUrl: { control: false, description: '사진 내용을 받을 주소' },
    alt: { description: '사진 대체 텍스트' },
    errorMode: {
      control: 'inline-radio',
      options: ['message', 'retry-only'],
      description: '불러오지 못했을 때 안내 문구와 다시 시도를 함께 보일지, 다시 시도 버튼만 보일지',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '20rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AuthenticatedPhoto>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    queryData: [[propertyQueryKeys.photoContent(10, 1), samplePhoto]],
  },
};

/** 스토리북에는 사진 서버가 없어 요청이 실패한 대체 화면이 그려진다. */
export const RequestFailed: Story = {};

export const RequestFailedRetryOnly: Story = {
  args: {
    errorMode: 'retry-only',
  },
};

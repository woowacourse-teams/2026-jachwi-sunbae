import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { propertyQueryKeys } from '@/features/property/api/propertyQueryKeys';
import type { PropertyMemoDocument } from '@/features/property/model/Property';

import PropertyMemoSection from './PropertyMemoSection';

const memo: PropertyMemoDocument = {
  propertyId: 10,
  freeMemo: '창문이 남향이라 낮에 밝음. 화장실 환풍기 소리가 조금 큼. 집주인이 도배는 해 준다고 함.',
};

const meta = {
  title: '페이지/매물 상세/PropertyMemoSection',
  component: PropertyMemoSection,
  argTypes: {
    propertyId: {
      control: false,
      description: '메모를 읽고 저장할 매물 ID. 표본 메모 캐시는 10번에만 넣어 두었다.',
    },
  },
  args: {
    propertyId: 10,
  },
  parameters: {
    layout: 'fullscreen',
    queryData: [[propertyQueryKeys.memo(10), memo]],
  },
} satisfies Meta<typeof PropertyMemoSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  parameters: {
    queryData: [[propertyQueryKeys.memo(10), { propertyId: 10, freeMemo: '' } satisfies PropertyMemoDocument]],
  },
};

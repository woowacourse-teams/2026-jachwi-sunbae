import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { InfoSection, InfoValue } from './InfoSection';

const meta = {
  title: '공통/InfoSection',
  component: InfoSection,
  argTypes: {
    children: { control: false },
    action: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof InfoSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PropertyBasic: Story = {
  args: {
    title: '기본 정보',
    label: '매물 기본 정보',
    children: (
      <>
        <InfoValue label="매물 이름" value="햇살 좋은 원룸" />
        <InfoValue label="보증금 / 월세" value="1,000 / 55 만원" />
        <InfoValue label="주소" value="주소를 입력해 주세요" emptyText="주소를 입력해 주세요" />
      </>
    ),
  },
};

export const WithEmptyValue: Story = {
  args: {
    title: '부가 정보',
    children: (
      <>
        <InfoValue label="입주 가능일" value="" emptyText="아직 정하지 않았어요" />
        <InfoValue label="관리비" value="" />
        <InfoValue label="방 옵션" value="에어컨, 세탁기" />
      </>
    ),
  },
};

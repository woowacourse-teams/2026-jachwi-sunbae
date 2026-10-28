import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import { Button } from '@/shared/ui/button/Button';
import TextField from '@/shared/ui/text-field/TextField';

import PropertyEditSheet from './PropertyEditSheet';

const meta = {
  title: '페이지/매물 상세/PropertyEditSheet',
  component: PropertyEditSheet,
  argTypes: {
    title: { description: '시트 맨 위 제목.' },
    initialHeightPercent: {
      control: { type: 'range', min: 20, max: 100, step: 5 },
      description: '처음 열릴 때 시트 높이(화면 높이 대비 %).',
    },
    children: { control: false, description: '시트 안에 넣을 수정 폼.' },
    onClose: { description: '닫기 버튼이나 시트 바깥 영역을 누르면 부른다.' },
  },
  args: {
    title: '기본 정보 수정',
    initialHeightPercent: 70,
    onClose: fn(),
    children: (
      <form style={{ display: 'grid', gap: '1rem' }} onSubmit={(event) => event.preventDefault()}>
        <TextField label="매물 이름" defaultValue="햇살 좋은 원룸" />
        <TextField label="확인한 곳" defaultValue="신림역 행복공인중개사" />
        <Button type="submit" variant="soft" fullWidth>
          기본 정보 저장
        </Button>
      </form>
    ),
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyEditSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Short: Story = {
  args: {
    title: '메모 수정',
    initialHeightPercent: 40,
    children: <TextField label="메모" defaultValue="창문이 남향이라 낮에 밝음." />,
  },
};

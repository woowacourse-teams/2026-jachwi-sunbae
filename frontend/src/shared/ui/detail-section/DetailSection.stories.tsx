import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '../button/Button';
import Icon from '../icon/Icon';
import DetailSection from './DetailSection';

const meta = {
  title: '공통/DetailSection',
  component: DetailSection,
  argTypes: {
    children: { control: false },
    meta: { control: false },
    action: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DetailSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: '기본 정보',
    children: <p style={{ margin: 0 }}>섹션 콘텐츠가 들어갑니다.</p>,
  },
};

export const WithMetaAndAction: Story = {
  args: {
    title: '사진',
    meta: <span>3/30</span>,
    action: (
      <Button type="button" variant="text">
        <Icon name="edit" size={14} /> 편집
      </Button>
    ),
    children: (
      <div
        style={{
          minHeight: '5rem',
          display: 'grid',
          placeItems: 'center',
          border: '1px dashed var(--color-border-strong)',
          color: 'var(--color-muted)',
        }}
      >
        사진 미리보기
      </div>
    ),
  },
};

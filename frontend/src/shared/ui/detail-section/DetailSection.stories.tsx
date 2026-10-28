import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '../button/Button';
import Icon from '../icon/Icon';
import DetailSection from './DetailSection';

/** 제목 옆 보조 정보. 값은 이름으로 두고 그릴 때 요소로 바꾼다. */
const metas = {
  없음: undefined,
  '사진 수 (3/30)': <span>3/30</span>,
};

/** 헤더 오른쪽 액션. */
const actions = {
  없음: undefined,
  '편집 버튼': (
    <Button type="button" variant="text">
      <Icon name="edit" size={14} /> 편집
    </Button>
  ),
};

const photoPreview = (
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
);

const meta = {
  title: '공용/DetailSection',
  component: DetailSection,
  args: {
    meta: '없음',
    action: '없음',
  },
  argTypes: {
    title: { description: '섹션 제목' },
    children: { control: false },
    meta: {
      control: 'inline-radio',
      options: Object.keys(metas),
      mapping: metas,
      description: '제목 옆에 붙는 보조 정보(개수 등)',
    },
    action: { control: 'inline-radio', options: Object.keys(actions), mapping: actions },
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
    meta: '사진 수 (3/30)',
    action: '편집 버튼',
    children: photoPreview,
  },
};

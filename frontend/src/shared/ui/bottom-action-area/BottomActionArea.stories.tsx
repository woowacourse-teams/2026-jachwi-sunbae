import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '../button/Button';
import BottomActionArea from './BottomActionArea';

const action = (
  <>
    <Button variant="secondary">이전</Button>
    <Button>다음</Button>
  </>
);

const meta = {
  title: '공통/BottomActionArea',
  component: BottomActionArea,
  args: {
    children: action,
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BottomActionArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sticky: Story = {
  render: () => (
    <div style={{ minHeight: '16rem', padding: '1rem' }}>
      <p>스크롤 컨테이너 안에서 하단에 붙어 있는 액션 영역입니다.</p>
      <BottomActionArea>{action}</BottomActionArea>
    </div>
  ),
};

export const Screen: Story = {
  render: () => (
    <div style={{ minHeight: '16rem', padding: '1rem' }}>
      <p>화면 하단에 고정되는 주요 액션 영역입니다.</p>
      <BottomActionArea placement="screen">{action}</BottomActionArea>
    </div>
  ),
};

export const InlineWithoutDivider: Story = {
  render: () => (
    <div style={{ padding: '1rem' }}>
      <BottomActionArea placement="inline" divider={false}>
        <Button fullWidth>저장하기</Button>
      </BottomActionArea>
    </div>
  ),
};

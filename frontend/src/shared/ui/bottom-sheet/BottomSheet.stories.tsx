import { css } from '@emotion/css';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import BottomSheet from './BottomSheet';

const meta = {
  title: '공용/BottomSheet',
  component: BottomSheet,
  args: {
    title: '상세 정보',
    children: <p>손잡이를 올리거나 눌러 패널 높이를 바꿀 수 있어요.</p>,
    closeLabel: '상세 닫기',
    showCloseButton: true,
    resizable: true,
    initialHeightPercent: 58,
    onClose: fn(),
  },
  argTypes: {
    title: { description: '패널 제목. 화면 낭독기가 읽는 영역 이름도 된다.' },
    children: { control: false },
    closeLabel: { description: '닫기 버튼을 화면 낭독기가 읽는 이름' },
    showCloseButton: { description: '오른쪽 위 닫기 버튼을 그릴지' },
    resizable: { description: '손잡이로 높이를 바꿀 수 있는지' },
    initialHeightPercent: {
      control: { type: 'range', min: 25, max: 88, step: 1 },
      description: '처음 높이(부모 높이 대비 %). 25~88 사이로 맞춘다.',
    },
    onClose: { control: false, description: '닫기 버튼·Esc·아래로 끌어내리기로 닫을 때 부르는 함수' },
  },
  decorators: [
    (Story) => (
      <div className={styles.canvas}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Fixed: Story = { args: { resizable: false, showCloseButton: false, initialHeightPercent: 40 } };

const styles = {
  canvas: css`
    label: BottomSheet.stories-canvas;
    position: relative;
    height: 35rem;
    max-width: 26rem;
    background: #e9ece8;
  `,
};

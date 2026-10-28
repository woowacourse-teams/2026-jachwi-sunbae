import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import RecordsAddButton from './RecordsAddButton';

const meta = {
  title: '페이지/본 방 기록/휴대폰/RecordsAddButton',
  globals: { viewport: { value: 'mobile', isRotated: false } },
  component: RecordsAddButton,
  args: {
    hint: '+ 버튼으로 메모·매물을 추가해요',
    onChoose: fn(),
  },
  argTypes: {
    onChoose: { description: '펼친 메뉴에서 메모·매물 중 하나를 고르면 그 종류로 부른다.' },
  },
  decorators: [
    (Story) => (
      // 지도 가운데 아래에 떠 있는 버튼이라 휴대폰 지도 크기의 칸 안에 둔다.
      <div style={{ position: 'relative', width: '24rem', height: '16rem', background: '#e8efe4' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecordsAddButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '추가하기' }));
  },
};

export const NoRecords: Story = {
  args: {
    hint: '아직 기록한 방이 없어요 · + 버튼으로 메모·매물을 추가해요',
  },
};

import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '../button/Button';
import BottomActionArea from './BottomActionArea';

/** 컨트롤에서 고르는 버튼 구성. 값은 이름으로 두고 그릴 때 버튼으로 바꾼다. */
const actions = {
  '이전·다음': (
    <>
      <Button variant="secondary">이전</Button>
      <Button>다음</Button>
    </>
  ),
  '저장 하나': <Button fullWidth>저장하기</Button>,
};

/** 액션 영역이 놓이는 화면 흐름을 흉내 낸다. */
const withPage =
  (text?: string): Decorator =>
  (Story) => (
    <div style={{ minHeight: '16rem', padding: '1rem' }}>
      {text && <p>{text}</p>}
      <Story />
    </div>
  );

const meta = {
  title: '공용/BottomActionArea',
  component: BottomActionArea,
  args: {
    children: '이전·다음',
    placement: 'sticky',
    divider: true,
  },
  argTypes: {
    children: { control: 'inline-radio', options: Object.keys(actions), mapping: actions },
    placement: { control: 'inline-radio', options: ['inline', 'sticky', 'screen'] },
    divider: { description: '위쪽 구분선을 그릴지' },
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BottomActionArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sticky: Story = {
  decorators: [withPage('스크롤 컨테이너 안에서 하단에 붙어 있는 액션 영역입니다.')],
};

export const Screen: Story = {
  args: { placement: 'screen' },
  decorators: [withPage('화면 하단에 고정되는 주요 액션 영역입니다.')],
};

export const InlineWithoutDivider: Story = {
  args: { placement: 'inline', divider: false, children: '저장 하나' },
  decorators: [withPage()],
};

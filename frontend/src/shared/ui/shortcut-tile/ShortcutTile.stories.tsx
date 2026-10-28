import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import iconHome from '@/shared/assets/illustrations/icon-home.webp';
import iconInfo from '@/shared/assets/illustrations/icon-info.webp';
import iconMap from '@/shared/assets/illustrations/icon-map.webp';

import ShortcutTile from './ShortcutTile';

/** 컨트롤에서 고르는 아이콘 이미지. 값은 이름으로 두고 그릴 때 이미지 주소로 바꾼다. */
const icons = { 집: iconHome, 지도: iconMap, 안내: iconInfo };

// to/onClick 유니언 props라 satisfies 대신 타입을 직접 지정한다.
const meta: Meta<typeof ShortcutTile> = {
  title: '공용/ShortcutTile',
  component: ShortcutTile,
  decorators: [
    (Story) => (
      <div style={{ width: '5rem' }}>
        <Story />
      </div>
    ),
  ],
  args: { label: '홈', icon: '집', to: '/' },
  argTypes: {
    icon: { control: 'inline-radio', options: Object.keys(icons), mapping: icons },
    to: { control: 'text', description: '이동할 주소. 주면 링크로, 비우고 `onClick`을 주면 버튼으로 그린다.' },
    onClick: { control: false },
  },
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof ShortcutTile>;

export const Default: Story = {};
export const LongLabel: Story = { args: { label: '자주 쓰는 체크리스트 모아보기' } };
/** `to` 없이 `onClick`만 주면 버튼으로 그린다. 누르면 Actions 패널에 찍힌다. */
export const AsButton: Story = { args: { label: '지도 열기', icon: '지도', to: undefined, onClick: fn() } };

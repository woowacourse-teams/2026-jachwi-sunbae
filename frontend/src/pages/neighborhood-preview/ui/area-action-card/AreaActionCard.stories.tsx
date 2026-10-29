import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import Icon from '@/shared/ui/icon/Icon';

import AreaActionCard from './AreaActionCard';

const iconOptions = ['map', 'external-link', 'search', 'home', 'info'] as const;

const meta = {
  title: '페이지/동네 찾기/공통/AreaActionCard',
  component: AreaActionCard,
  argTypes: {
    icon: {
      control: 'select',
      options: iconOptions,
      mapping: Object.fromEntries(iconOptions.map((name) => [name, <Icon key={name} name={name} size={24} />])),
      description: '카드 왼쪽 아이콘',
    },
    title: { description: '카드 제목' },
    description: { description: '제목 아래 설명' },
    link: { control: 'object', description: '`{ to }`면 서비스 안 경로, `{ href }`면 새 탭 외부 주소' },
    onOpen: { description: '카드를 눌러 열 때' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    icon: 'map',
    title: '주변 시설 보기',
    description: '망원동 병원·편의점·정류장 살펴보기',
    link: { to: '/neighborhoods/areas/1144069000/nearby' },
    onOpen: fn(),
  },
} satisfies Meta<typeof AreaActionCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InternalLink: Story = {};

export const ExternalLink: Story = {
  args: {
    icon: 'external-link',
    title: '현재 매물 확인하기',
    description: '다방에서 망원동 원·투룸 보기',
    link: { href: 'https://www.dabangapp.com/' },
  },
};

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Icon from '@/shared/ui/icon/Icon';

import AreaActionCard from './AreaActionCard';

const meta = {
  title: '페이지/동네 찾기/AreaActionCard',
  component: AreaActionCard,
  argTypes: {
    icon: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    icon: <Icon name="map" size={24} />,
    title: '주변 시설 보기',
    description: '망원동 병원·편의점·정류장 살펴보기',
    link: { to: '/neighborhoods/areas/1144069000/nearby' },
    onOpen: () => undefined,
  },
} satisfies Meta<typeof AreaActionCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InternalLink: Story = {};

export const ExternalLink: Story = {
  args: {
    icon: <Icon name="external-link" size={24} />,
    title: '현재 매물 확인하기',
    description: '다방에서 망원동 원·투룸 보기',
    link: { href: 'https://www.dabangapp.com/' },
  },
};

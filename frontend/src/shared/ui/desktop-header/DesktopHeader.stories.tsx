import type { Meta, StoryObj } from '@storybook/react-webpack5';

import DesktopHeader from './DesktopHeader';

const meta = {
  title: '공용/DesktopHeader',
  component: DesktopHeader,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DesktopHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ActiveMenu: Story = {
  parameters: {
    route: '/checklists',
  },
};

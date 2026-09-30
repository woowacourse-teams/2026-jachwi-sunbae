import type { Meta, StoryObj } from '@storybook/react-webpack5';

import SelectionControl from './SelectionControl';

const meta = {
  title: '공통/SelectionControl',
  component: SelectionControl,
  parameters: {
    layout: 'padded',
  },
  args: {
    checked: false,
    onSelect: () => undefined,
    children: <span>채광과 방향을 확인했나요?</span>,
  },
} satisfies Meta<typeof SelectionControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    checked: true,
    disabled: true,
  },
};

export const Radio: Story = {
  args: {
    type: 'radio',
    name: 'checklist-stage',
    value: 'on-site',
    checked: true,
    children: <span>현장 체크</span>,
  },
};

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import SelectionControl from './SelectionControl';

import styles from './SelectionControl.stories.module.css';

const meta = {
  title: '공통/폼 선택 동작/SelectionControl',
  component: SelectionControl,
  argTypes: {
    children: { control: false },
    className: { control: false },
    markClassName: { control: false },
    mark: { control: false },
    dataAttributes: { control: false },
  },
  parameters: {
    layout: 'padded',
  },
  args: {
    checked: false,
    onSelect: () => undefined,
  },
} satisfies Meta<typeof SelectionControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

Unchecked.args = {
  className: styles.option,
  markClassName: styles.mark,
  children: <span>채광과 방향을 확인했나요?</span>,
};

export const Checked: Story = {
  args: {
    checked: true,
    className: styles.option,
    markClassName: styles.mark,
    children: <span>채광과 방향을 확인했나요?</span>,
  },
};

export const Disabled: Story = {
  args: {
    checked: true,
    disabled: true,
    className: styles.option,
    markClassName: styles.mark,
    children: <span>채광과 방향을 확인했나요?</span>,
  },
};

export const Radio: Story = {
  args: {
    type: 'radio',
    name: 'checklist-stage',
    value: 'on-site',
    checked: true,
    className: styles.option,
    markClassName: styles.mark,
    children: <span>현장 체크</span>,
  },
};

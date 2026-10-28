import { css, cx } from '@emotion/css';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import SelectionControl from './SelectionControl';

const styles = {
  // 다른 요소의 선택자에서 `.SelectionControl.stories-option`로 가리킨다.
  option: cx(
    css`
      label: SelectionControl.stories-option;
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      min-width: 15rem;
      padding: 0.75rem 0.9rem;
      border: 1px solid var(--color-border-strong, #d9dce1);
      border-radius: 0.65rem;
      background: var(--color-surface, #fff);
      color: var(--color-ink, #212124);

      &[data-selected='true'] {
        border-color: var(--color-primary, #6c873b);
        background: var(--color-surface-brand, #f2f2f2);
      }

      &:has(input:focus-visible) {
        outline: 2px solid var(--color-focus, #9bbd55);
        outline-offset: 2px;
      }

      &:has(input:disabled) {
        opacity: 0.5;
      }
    `,
    'SelectionControl.stories-option',
  ),

  mark: css`
    label: SelectionControl.stories-mark;
    display: grid;
    width: 1.1rem;
    height: 1.1rem;
    flex: none;
    place-items: center;
    border: 1px solid var(--color-border-strong, #d9dce1);
    border-radius: 0.3rem;
    color: var(--color-surface, #fff);
    font-size: 0.75rem;
    line-height: 1;

    .SelectionControl.stories-option[data-selected='true'] & {
      border-color: var(--color-primary, #6c873b);
      background: var(--color-primary, #6c873b);
    }
  `,
};

const meta = {
  title: '공용/SelectionControl',
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

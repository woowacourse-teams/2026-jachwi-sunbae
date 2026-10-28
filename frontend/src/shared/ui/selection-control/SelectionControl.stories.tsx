import { css, cx } from '@emotion/css';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

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
    type: { control: 'inline-radio', options: ['checkbox', 'radio'], description: '체크박스인지 라디오인지' },
    checked: { description: '선택 여부. 눌러서 바꾸면 컨트롤 값도 함께 바뀐다.' },
    children: { control: 'text', description: '선택지 문구' },
    className: { control: false },
    markClassName: { control: false },
    mark: { control: false },
    dataAttributes: { control: 'object' },
    onSelect: { control: false },
  },
  parameters: {
    layout: 'padded',
  },
  args: {
    type: 'checkbox',
    checked: false,
    disabled: false,
    className: styles.option,
    markClassName: styles.mark,
    children: '채광과 방향을 확인했나요?',
    onSelect: fn(),
  },
  // 누르면 checked를 args에 되돌려 써서 컨트롤 패널과 화면이 같은 상태를 보게 한다.
  render: function ControlledSelection(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <SelectionControl
        {...args}
        onSelect={() => {
          args.onSelect();
          updateArgs({ checked: args.type === 'radio' ? true : !args.checked });
        }}
      />
    );
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
    children: '현장 체크',
  },
};

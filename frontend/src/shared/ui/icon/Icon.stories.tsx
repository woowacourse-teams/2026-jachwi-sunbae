import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { IconName } from './Icon';
import Icon from './Icon';

const iconNames: IconName[] = [
  'plus',
  'map',
  'inbox',
  'search',
  'checklist',
  'home',
  'user',
  'edit',
  'trash',
  'close',
  'chevron-right',
  'external-link',
];

const meta = {
  title: '공통/Icon',
  component: Icon,
  args: {
    name: 'plus',
    size: 24,
  },
  argTypes: {
    name: {
      control: 'select',
      options: iconNames,
    },
    size: {
      control: { type: 'range', min: 12, max: 48, step: 2 },
    },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Gallery: Story = {
  render: ({ size }) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 5rem)',
        gap: '1rem',
        color: 'var(--color-ink)',
      }}
    >
      {iconNames.map((name) => (
        <div key={name} style={{ display: 'grid', justifyItems: 'center', gap: '0.35rem' }}>
          <Icon name={name} size={size} />
          <small>{name}</small>
        </div>
      ))}
    </div>
  ),
};

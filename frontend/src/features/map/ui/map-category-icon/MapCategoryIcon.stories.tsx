import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { MapCategory } from '../../model/Map';
import MapCategoryIcon from './MapCategoryIcon';

const categories: Array<{ category: MapCategory; label: string }> = [
  { category: 'HOSPITAL', label: '병원' },
  { category: 'TRANSPORT', label: '교통' },
  { category: 'SCHOOL', label: '학교' },
  { category: 'CONVENIENCE', label: '편의점' },
  { category: 'AGENCY', label: '중개업소' },
  { category: 'MEMO', label: '거리 메모' },
];

const meta = {
  title: '기능/지도/MapCategoryIcon',
  component: MapCategoryIcon,
  args: {
    category: 'HOSPITAL',
  },
  argTypes: {
    category: {
      control: 'select',
      options: categories.map(({ category }) => category),
      description: '그릴 시설 종류',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ fontSize: '2rem', color: 'var(--color-ink)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MapCategoryIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 모든 종류를 한눈에 비교하는 모음이라 컨트롤을 따르지 않는다. */
export const AllCategories: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', gap: '1.5rem' }}>
      {categories.map(({ category, label }) => (
        <div key={category} style={{ display: 'grid', justifyItems: 'center', gap: '0.5rem' }}>
          <MapCategoryIcon category={category} />
          <span style={{ fontSize: '0.75rem' }}>{label}</span>
        </div>
      ))}
    </div>
  ),
};

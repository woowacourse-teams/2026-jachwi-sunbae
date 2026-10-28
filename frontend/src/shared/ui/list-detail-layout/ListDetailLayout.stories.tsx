import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ListDetailLayout from './ListDetailLayout';

const panelStyle = { padding: '1.5rem' };

const meta = {
  title: '공용/ListDetailLayout',
  component: ListDetailLayout,
  argTypes: {
    list: { control: false },
    detail: { control: false },
    children: { control: false },
  },
  args: {
    list: (
      <div style={panelStyle}>
        <h2>동네 목록</h2>
        <ol>
          <li>신림동</li>
          <li>봉천동</li>
          <li>서교동</li>
        </ol>
      </div>
    ),
    children: (
      <div style={{ ...panelStyle, height: '100%', background: '#e8eef5' }}>
        <p>지도 영역</p>
      </div>
    ),
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '40rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ListDetailLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ListOnly: Story = {};

export const WithDetail: Story = {
  args: {
    detail: (
      <div style={panelStyle}>
        <h2>신림동 대중교통</h2>
        <p>신림역까지 걸어서 7분, 강남역까지 지하철로 25분 걸려요.</p>
      </div>
    ),
    onCloseDetail: () => undefined,
    closeLabel: '신림동 상세 닫기',
  },
};

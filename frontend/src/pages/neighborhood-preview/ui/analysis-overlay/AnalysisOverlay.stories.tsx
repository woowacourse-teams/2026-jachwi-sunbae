import type { Meta, StoryObj } from '@storybook/react-webpack5';

import AnalysisOverlay from './AnalysisOverlay';

const meta = {
  title: '페이지/동네 찾기/AnalysisOverlay',
  component: AnalysisOverlay,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: '36rem', maxWidth: '26rem', background: '#e9ece8' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    preview: {
      isAnalyzing: true,
      error: null,
      destination: {
        name: '서울특별시청',
        address: '서울특별시 중구 세종대로 110',
        latitude: 37.5663,
        longitude: 126.9779,
      },
      maxMinutes: 40,
      isMockData: false,
      reset: () => undefined,
      retry: () => Promise.resolve({} as never),
    },
  },
} satisfies Meta<typeof AnalysisOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Analyzing: Story = {};

export const WithMockData: Story = {
  args: {
    preview: { ...meta.args.preview, isMockData: true },
  },
};

export const WithError: Story = {
  args: {
    preview: {
      ...meta.args.preview,
      isAnalyzing: false,
      error: '대중교통 정보를 준비하고 있습니다. 잠시 후 다시 시도해 주세요.',
    },
  },
};

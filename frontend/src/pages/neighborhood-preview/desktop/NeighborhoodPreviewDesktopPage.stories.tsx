import type { Meta, StoryObj } from '@storybook/react-webpack5';

import useNeighborhoodPreview from '../hooks/useNeighborhoodPreview';
import NeighborhoodPreviewDesktopPage from './NeighborhoodPreviewDesktopPage';

const SEARCH_SESSION_PREFIX = 'jachwi.neighborhood-search.';

/** 앱의 NeighborhoodPreviewPage처럼 화면 상태를 실제 Hook으로 만들어 넘긴다. 처음 열면 목적지 위치를 고르는 상태다. */
const NeighborhoodPreviewDesktopPreview = () => {
  const preview = useNeighborhoodPreview();
  return <NeighborhoodPreviewDesktopPage preview={preview} />;
};

/** 데스크탑 동네 찾기. 왼쪽 칸에 조건, 오른쪽에 지도(데모 지도)를 둔다. */
const meta: Meta<typeof NeighborhoodPreviewDesktopPage> = {
  title: '페이지/동네 찾기/데스크탑/NeighborhoodPreviewDesktopPage',
  component: NeighborhoodPreviewDesktopPage,
  globals: { viewport: { value: 'desktop', isRotated: false } },
  render: () => <NeighborhoodPreviewDesktopPreview />,
  argTypes: {
    preview: { control: false, description: 'useNeighborhoodPreview가 만든 화면 상태(스토리에서는 Hook으로 만든다)' },
  },
  parameters: {
    layout: 'fullscreen',
    route: '/neighborhoods',
  },
  decorators: [
    // 이전에 남긴 검색(분석 중 상태)이 있으면 지우고 처음 상태로 연다.
    (Story) => {
      try {
        Object.keys(window.sessionStorage)
          .filter((key) => key.startsWith(SEARCH_SESSION_PREFIX))
          .forEach((key) => window.sessionStorage.removeItem(key));
      } catch {
        // 저장소를 못 쓰면 그대로 연다.
      }
      return (
        <div style={{ position: 'relative', height: '100vh' }}>
          <Story />
        </div>
      );
    },
  ],
};

export default meta;

type Story = StoryObj<typeof NeighborhoodPreviewDesktopPage>;

/** 목적지 위치를 고르는 첫 상태. */
export const ChoosingLocation: Story = {};

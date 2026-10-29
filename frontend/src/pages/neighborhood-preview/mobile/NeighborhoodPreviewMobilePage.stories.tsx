import type { Meta, StoryObj } from '@storybook/react-webpack5';

import useNeighborhoodPreview from '../hooks/useNeighborhoodPreview';
import NeighborhoodPreviewMobilePage from './NeighborhoodPreviewMobilePage';

const SEARCH_SESSION_PREFIX = 'jachwi.neighborhood-search.';

/** 앱의 NeighborhoodPreviewPage처럼 화면 상태를 실제 Hook으로 만들어 넘긴다. 처음 열면 목적지 위치를 고르는 상태다. */
const NeighborhoodPreviewMobilePreview = () => {
  const preview = useNeighborhoodPreview();
  return <NeighborhoodPreviewMobilePage preview={preview} />;
};

/** 휴대폰 동네 찾기. 지도를 화면 전체에 두고 조건은 지도 위 칩·바텀시트로 고른다. */
const meta: Meta<typeof NeighborhoodPreviewMobilePage> = {
  title: '페이지/동네 찾기/휴대폰/NeighborhoodPreviewMobilePage',
  component: NeighborhoodPreviewMobilePage,
  globals: { viewport: { value: 'mobile', isRotated: false } },
  render: () => <NeighborhoodPreviewMobilePreview />,
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

type Story = StoryObj<typeof NeighborhoodPreviewMobilePage>;

/** 목적지 위치를 고르는 첫 상태. */
export const ChoosingLocation: Story = {};

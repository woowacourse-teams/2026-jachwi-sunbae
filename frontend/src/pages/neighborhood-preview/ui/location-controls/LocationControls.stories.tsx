import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { ComponentProps, ComponentType } from 'react';
import { fn } from 'storybook/test';

import LocationControls from './LocationControls';

type Props = ComponentProps<typeof LocationControls>;
/** `preview`에 든 값을 하나씩 컨트롤로 바꿔 보도록 펼쳐 둔다. 화면에는 다시 `preview`로 묶어 넘긴다. */
type StoryArgs = Props['preview'] & Omit<Props, 'preview'>;

const meta = {
  title: '페이지/동네 찾기/공통/LocationControls',
  // 컨트롤은 preview를 펼친 값으로 받아 render에서 다시 묶는다. props 모양이 달라 타입만 맞춰 주고, 문서는 실제 컴포넌트에서 읽는다.
  component: LocationControls as unknown as ComponentType<StoryArgs>,
  parameters: {
    layout: 'fullscreen',
    controls: { exclude: ['preview', 'className', 'ref'] },
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: '24rem', maxWidth: '26rem', background: '#e9ece8' }}>
        <Story />
      </div>
    ),
  ],
  render: ({ isResult, isFilterOpen, ...preview }) => (
    <LocationControls preview={preview} isResult={isResult} isFilterOpen={isFilterOpen} />
  ),
  argTypes: {
    isLocating: { description: '현재 위치를 확인하는 중인지. 말풍선으로 안내한다.' },
    locationError: { control: 'text', description: '위치를 확인하지 못했을 때 말풍선 문구' },
    moveToCurrentLocation: { description: '현재 위치로 지도 옮기기' },
    isFilterOpen: { description: '조건 필터가 열려 있는지. 열려 있으면 버튼 위치를 옮긴다.' },
  },
  args: {
    isLocating: false,
    locationError: null,
    moveToCurrentLocation: fn(() => Promise.resolve()),
    isResult: false,
    isFilterOpen: false,
  },
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Locating: Story = {
  args: {
    isLocating: true,
  },
};

export const WithError: Story = {
  args: {
    locationError: '위치 권한을 허용해 주세요.',
  },
};

export const OnResult: Story = {
  args: {
    isResult: true,
  },
};

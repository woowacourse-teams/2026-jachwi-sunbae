import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';

import useRecommendedAreaLayer, {
  readRecommendedAreaLayerOn,
  writeRecommendedAreaLayerOn,
} from '@/pages/neighborhood-preview/model/recommendedAreaLayer';
import MapBookmarkToggle from '@/features/map/ui/map-bookmark-toggle/MapBookmarkToggle';
import MapRecommendedAreaToggle from '@/features/map/ui/map-recommended-area-toggle/MapRecommendedAreaToggle';

afterEach(() => {
  writeRecommendedAreaLayerOn(true);
  localStorage.removeItem('jachwi:recommended-area-layer');
});

it('켜져 있으면 `추천 동네 숨기기`, 꺼져 있으면 `추천 동네 보기`로 알리고 누르면 토글을 부른다', async () => {
  const toggle = vi.fn();
  const { rerender } = render(<MapRecommendedAreaToggle isOn onToggle={toggle} />);
  const on = screen.getByRole('button', { name: '추천 동네 숨기기' });
  expect(on).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(on);
  expect(toggle).toHaveBeenCalledOnce();
  rerender(<MapRecommendedAreaToggle isOn={false} onToggle={toggle} />);
  const off = screen.getByRole('button', { name: '추천 동네 보기' });
  expect(off).toHaveAttribute('aria-pressed', 'false');
  // 평소 켜 두는 층이라 끄면 점선과 회색 바탕으로 꺼져 있음을 분명히 그린다.
  expect(off).toHaveAttribute('data-marks-off', 'true');
});

it('찜 버튼과 같은 컨트롤 모양을 쓰고 지도 오른쪽 묶음에서 찜 버튼 바로 아래 칸에 놓인다', () => {
  render(
    <>
      <MapBookmarkToggle isOn count={1} onToggle={() => undefined} />
      <MapRecommendedAreaToggle isOn onToggle={() => undefined} />
    </>,
  );
  const bookmark = screen.getByRole('button', { name: '찜한 동네 숨기기, 1곳' });
  const recommended = screen.getByRole('button', { name: '추천 동네 숨기기' });
  expect(bookmark.className).toBe(recommended.className);
  expect(bookmark).toHaveAttribute('data-slot', '0');
  expect(recommended).toHaveAttribute('data-slot', '1');
});

it('고른 적이 없으면 켜고, 끈 값을 기기에 남겨 새로고침해도 따른다', () => {
  expect(readRecommendedAreaLayerOn()).toBe(true);
  writeRecommendedAreaLayerOn(false);
  expect(localStorage.getItem('jachwi:recommended-area-layer')).toBe('off');
  expect(readRecommendedAreaLayerOn()).toBe(false);
});

/** 통합 지도는 내 기록과 동네 찾기 화면, 휴대폰과 데스크탑 화면이 같은 값을 본다. */
const Screen = ({ name }: { name: string }) => {
  const layer = useRecommendedAreaLayer();
  return (
    <button type="button" aria-pressed={layer.isOn} onClick={layer.toggle}>
      {name}
    </button>
  );
};

it('한 화면에서 끄면 다른 화면도, 화면을 새로 그려도 꺼진 상태를 이어 쓴다', async () => {
  const user = userEvent.setup();
  const { unmount } = render(
    <>
      <Screen name="동네 찾기" />
      <Screen name="다른 화면" />
    </>,
  );
  await user.click(screen.getByRole('button', { name: '동네 찾기' }));
  expect(screen.getByRole('button', { name: '동네 찾기' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('button', { name: '다른 화면' })).toHaveAttribute('aria-pressed', 'false');
  unmount();
  render(<Screen name="동네 찾기" />);
  expect(screen.getByRole('button', { name: '동네 찾기' })).toHaveAttribute('aria-pressed', 'false');
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';

import useMapSheet from '@/pages/map/hooks/useMapSheet';

afterEach(() => vi.restoreAllMocks());

it('탭 뒤의 시트 배경은 자르지 않고 카드 높이와 탭 여백을 합쳐 펼친다', async () => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const height = this.dataset.stage !== undefined ? 800 : this.dataset.sheet !== undefined ? 700 : 36;
    return { height, width: 390, x: 0, y: 0, top: 0, left: 0, right: 390, bottom: height, toJSON: () => ({}) };
  });
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(100);
  const Harness = () => {
    const sheet = useMapSheet();
    return (
      <div data-stage>
        <section ref={sheet.sheetRef} data-sheet data-single="true" style={{ paddingBottom: 88 }}>
          <button onClick={sheet.previewSheet}>펼치기</button>
          <div data-sheet-content hidden={sheet.sheetStage === 'closed'}>
            매물 카드
          </div>
        </section>
      </div>
    );
  };
  const { container } = render(<Harness />);
  await userEvent.click(screen.getByRole('button', { name: '펼치기' }));
  const sheet = container.querySelector<HTMLElement>('[data-sheet]')!;
  expect(sheet.style.transform).toBe('translate3d(0, 476px, 0)');
  expect(sheet.style.clipPath).toBe('');
  expect(sheet.style.getPropertyValue('--map-sheet-content-height')).toBe('100px');
  expect(sheet.parentElement?.style.getPropertyValue('--map-sheet-visible-height')).toBe('144px');
});

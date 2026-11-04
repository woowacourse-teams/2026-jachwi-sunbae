import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import DesktopHeader from '@/shared/ui/desktop-header/DesktopHeader';

describe('DesktopHeader', () => {
  it('로고로 홈에 가고, 주요 화면 메뉴에서 지금 화면을 표시한다', () => {
    render(
      <MemoryRouter initialEntries={['/neighborhoods']}>
        <DesktopHeader />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '홈으로 돌아가기' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '마이페이지' })).toHaveAttribute('href', '/me');
    const nav = screen.getByRole('navigation', { name: '주요 화면' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['본 방 기록', '동네 찾기', '체크리스트', '방 비교', '저렴한 한 끼']);
    expect(within(nav).getByRole('link', { name: '동네 찾기' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: '본 방 기록' })).not.toHaveAttribute('aria-current');
  });

  it.each(['/cheap-meals/restaurant', '/cheap-meals/delivery', '/cheap-meals'])(
    '저렴한 한 끼 메뉴는 식당 탭 주소로 바로 가고, %s 같은 어느 탭에서도 지금 화면으로 표시한다',
    (entry) => {
      render(
        <MemoryRouter initialEntries={[entry]}>
          <DesktopHeader />
        </MemoryRouter>,
      );

      const nav = screen.getByRole('navigation', { name: '주요 화면' });
      const link = within(nav).getByRole('link', { name: '저렴한 한 끼' });
      expect(link).toHaveAttribute('href', '/cheap-meals/restaurant');
      expect(link).toHaveAttribute('aria-current', 'page');
      expect(within(nav).getByRole('link', { name: '방 비교' })).not.toHaveAttribute('aria-current');
    },
  );

  it('저렴한 한 끼와 이름만 비슷한 주소에서는 메뉴를 고른 상태로 두지 않는다', () => {
    render(
      <MemoryRouter initialEntries={['/cheap-meals-old']}>
        <DesktopHeader />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '저렴한 한 끼' })).not.toHaveAttribute('aria-current');
  });
});

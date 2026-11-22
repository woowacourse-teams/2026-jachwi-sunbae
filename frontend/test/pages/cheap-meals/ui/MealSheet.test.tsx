import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import MealSheet from '@/pages/cheap-meals/ui/MealSheet';

describe('MealSheet', () => {
  it('붙으면 모달로 열고 뒤 화면 스크롤을 막으며, 떨어지면 닫고 스크롤과 초점을 되돌린다', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    document.body.style.overflow = 'auto';

    const { unmount } = render(
      <MealSheet title="상품 상세" layout="desktop" onClose={vi.fn()}>
        내용
      </MealSheet>,
    );
    const dialog = screen.getByRole('dialog', { name: '상품 상세', hidden: true });
    expect(dialog).toHaveAttribute('open');
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(dialog).not.toHaveAttribute('open');
    expect(document.body.style.overflow).toBe('auto');
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});

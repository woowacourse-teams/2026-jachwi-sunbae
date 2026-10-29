import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ChecklistProgressRing from '@/features/checklist/ui/checklist-progress-ring/ChecklistProgressRing';

describe('ChecklistProgressRing', () => {
  it('괜찮음, 주의, 미확인 결과를 고리 조각과 세로 범례로 표시한다', () => {
    const { container } = render(
      <ChecklistProgressRing progress={{ goodCount: 2, cautionCount: 1, unconfirmedCount: 1 }} />,
    );

    const summary = screen.getByRole('list', { name: '체크리스트 진행 결과 집계' });
    expect(summary).toHaveTextContent('괜찮음2');
    expect(summary).toHaveTextContent('주의1');
    expect(summary).toHaveTextContent('미확인1');
    expect(container.querySelectorAll('svg circle')).toHaveLength(3);
  });

  it('결과가 0개인 상태는 고리에 그리지 않고 범례에는 표시한다', () => {
    const { container } = render(
      <ChecklistProgressRing progress={{ goodCount: 0, cautionCount: 2, unconfirmedCount: 1 }} />,
    );

    expect(container.querySelectorAll('svg circle')).toHaveLength(2);
    expect(screen.getByRole('list', { name: '체크리스트 진행 결과 집계' })).toHaveTextContent('괜찮음0');
  });

  it('한 가지 결과만 있으면 끊김 없는 고리 하나로 그린다', () => {
    const { container } = render(
      <ChecklistProgressRing progress={{ goodCount: 0, cautionCount: 0, unconfirmedCount: 3 }} />,
    );

    const circles = container.querySelectorAll('svg circle');
    expect(circles).toHaveLength(1);
    expect(circles[0]).toHaveAttribute('data-status', 'UNCONFIRMED');
  });
});
